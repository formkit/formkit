import { empty } from '@formkit/utils'
import {
  parseRules,
  defaultHints,
  createValidationPlugin,
  FormKitValidationRule,
  getValidationMessages,
} from '../src/validation'
import {
  createNode,
  FormKitNode,
  FormKitMiddleware,
  FormKitTextFragment,
} from '@formkit/core'
import { describe, expect, it, vi } from 'vitest'

const defaultValidation = {
  ...defaultHints,
  timer: 0,
  queued: true,
  state: null,
  deps: new Map(),
}

const nextTick = () => new Promise<void>((r) => setTimeout(r, 0))

describe('validation rule parsing', () => {
  it('can parse a single string rule', () => {
    const required = () => true
    expect(parseRules('required', { required })).toEqual([
      {
        ...defaultValidation,
        args: [],
        rule: required,
        name: 'required',
      },
    ])
  })

  it('can parse a multiple string rules', () => {
    const required = () => true
    const flavor = () => true
    expect(parseRules('required|flavor', { required, flavor })).toEqual([
      {
        ...defaultValidation,
        rule: required,
        name: 'required',
        args: [],
      },
      {
        ...defaultValidation,
        rule: flavor,
        name: 'flavor',
        args: [],
      },
    ])
  })

  it('can parse string arguments', () => {
    const flavor = () => true
    const before = () => true
    const flavorResult = {
      ...defaultValidation,
      rule: flavor,
      name: 'flavor',
      args: ['apple', 'banana'],
    }
    expect(parseRules('flavor:apple,banana', { flavor })).toEqual([
      flavorResult,
    ])
    expect(
      parseRules('before:10/15/2020|flavor:apple,banana', { flavor, before })
    ).toEqual([
      {
        ...defaultValidation,
        rule: before,
        name: 'before',
        args: ['10/15/2020'],
      },
      flavorResult,
    ])
  })

  it('can use the “force” validator hint', () => {
    const flavor = () => true
    expect(parseRules('*flavor:apple|flavor', { flavor })).toEqual([
      {
        ...defaultValidation,
        rule: flavor,
        name: 'flavor',
        args: ['apple'],
        force: true,
      },
      {
        ...defaultValidation,
        rule: flavor,
        name: 'flavor',
        args: [],
      },
    ])
  })

  it('can use the “empty” validator hint', () => {
    const pizza = () => true
    expect(parseRules('+pizza:cheese|pizza', { pizza })).toEqual([
      {
        ...defaultValidation,
        rule: pizza,
        name: 'pizza',
        args: ['cheese'],
        force: false,
        skipEmpty: false,
      },
      {
        ...defaultValidation,
        rule: pizza,
        name: 'pizza',
        args: [],
        skipEmpty: true,
      },
    ])
  })

  it('leaves out validations that do not have matching rules', () => {
    const all9s = () => true
    expect(parseRules('required|all9s', { all9s })).toEqual([
      {
        ...defaultValidation,
        rule: all9s,
        name: 'all9s',
        args: [],
      },
    ])
  })

  it('preserves hints provided by the validation rule', () => {
    const required = () => true
    required.skipEmpty = false
    expect(parseRules('required', { required })).toEqual([
      {
        ...defaultValidation,
        rule: required,
        args: [],
        name: 'required',
        skipEmpty: false,
      },
    ])
  })

  it('it uses inline hints to override function hints', () => {
    const required = () => true
    required.force = false
    expect(parseRules('*required', { required })).toEqual([
      {
        ...defaultValidation,
        rule: required,
        name: 'required',
        args: [],
        force: true,
      },
    ])
  })

  it('can parse multiple hints, in either direction', () => {
    const required = () => true
    required.force = false
    const result = [
      {
        ...defaultValidation,
        rule: required,
        name: 'required',
        args: [],
        force: true,
        blocking: false,
      },
    ]
    expect(parseRules('*?required', { required })).toEqual(result)
    expect(parseRules('?*required', { required })).toEqual(result)
  })

  it('can parse debounce hints in the middle', () => {
    const required = () => true
    required.force = false
    expect(parseRules('*(200)?required', { required })).toEqual([
      {
        ...defaultValidation,
        rule: required,
        name: 'required',
        args: [],
        debounce: 200,
        blocking: false,
        force: true,
      },
    ])
  })

  it('can parse debounce hints at the start', () => {
    const required = () => true
    required.force = false
    expect(parseRules('(5)*?required', { required })).toEqual([
      {
        ...defaultValidation,
        rule: required,
        name: 'required',
        args: [],
        debounce: 5,
        blocking: false,
        force: true,
      },
    ])
  })

  it('can parse debounce hints at the end', () => {
    const required = () => true
    required.force = false
    expect(parseRules('*?(999)required', { required })).toEqual([
      {
        ...defaultValidation,
        rule: required,
        name: 'required',
        args: [],
        debounce: 999,
        blocking: false,
        force: true,
      },
    ])
  })

  it('can parse solo debounce hints', () => {
    const required = () => true
    const free = () => true
    required.force = false
    expect(parseRules('free|(2000)required', { required, free })).toEqual([
      {
        ...defaultValidation,
        args: [],
        rule: free,
        name: 'free',
      },
      {
        ...defaultValidation,
        args: [],
        rule: required,
        name: 'required',
        debounce: 2000,
      },
    ])
  })

  it('can parse rules in array format', () => {
    const required = () => true
    const party = () => true
    expect(
      parseRules([['required'], ['*party', 'arg1', 'arg2']], {
        required,
        party,
      })
    ).toEqual([
      {
        ...defaultValidation,
        rule: required,
        name: 'required',
        args: [],
      },
      {
        ...defaultValidation,
        rule: party,
        name: 'party',
        args: ['arg1', 'arg2'],
        force: true,
      },
    ])
  })

  it('preserves types when using array syntax', () => {
    const matches = () => true
    const parsed = parseRules([['matches', /^S.*$/]], { matches })
    expect(parsed[0].args[0]).toBeInstanceOf(RegExp)
  })

  it('parses hints in array syntax', () => {
    const matches = () => true
    const parsed = parseRules([['*matches', /^S.*$/]], { matches })
    expect(parsed[0].force).toBeTruthy()
  })
})

describe('validation rule sequencing', () => {
  const required: FormKitValidationRule = ({ value }) => !empty(value)
  required.skipEmpty = false
  const validationPlugin = createValidationPlugin({
    required,
    length: ({ value }, length) => ('' + value).length >= parseInt(length),
    contains: ({ value }, substr) => ('' + value).includes(substr),
    exists: ({ value }) => {
      return new Promise((resolve) =>
        setTimeout(() => {
          resolve(['bar', 'foobar'].includes(String(value)))
        }, 100)
      )
    },
    confirm: (node, address) => {
      return node.value === node.at(address)!.value
    },
  })

  it('shows required validation messages if all rules before it skipped', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'length:7|required',
      },
      value: '',
    })
    node.input('asdfq', false)
    await nextTick()
    expect(node.store).toHaveProperty('rule_length')
    expect(node.store).not.toHaveProperty('rule_required')
    node.input('', false)
    await nextTick()
    expect(node.store).not.toHaveProperty('rule_length')
    expect(node.store).toHaveProperty('rule_required')
  })

  it('runs non-async non-debounced rules synchronously with bailing', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'required|length:5|contains:bar',
      },
      value: '',
    })
    expect(node.store).toHaveProperty('rule_required')
    // Should not exist because of empty
    expect(node.store).not.toHaveProperty('rule_length')
    node.input('foo', false)
    await nextTick()
    // Should no longer fail on required, but on length
    expect(node.store).not.toHaveProperty('rule_required')
    expect(node.store).toHaveProperty('rule_length')
    expect(node.store).not.toHaveProperty('rule_contains')
    node.input('foo foo', false)
    await nextTick()
    expect(node.store).not.toHaveProperty('rule_required')
    expect(node.store).not.toHaveProperty('rule_length')
    expect(node.store).toHaveProperty('rule_contains')
    node.input('foobar', false)
    await nextTick()
    expect(node.store).not.toHaveProperty('rule_required')
    expect(node.store).not.toHaveProperty('rule_length')
    expect(node.store).not.toHaveProperty('rule_contains')
  })

  it('runs rules serially after debounce', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'required|(200)length:5|*contains:bar',
      },
      value: '',
    })
    await nextTick()
    expect(node.store).toHaveProperty('rule_required')
    expect(node.store).not.toHaveProperty('rule_length')
    node.input('foo', false)
    await nextTick()
    expect(node.store).not.toHaveProperty('rule_required')
    expect(node.store).not.toHaveProperty('rule_length')
    await new Promise((r) => setTimeout(r, 205))
    expect(node.store).toHaveProperty('rule_length')
    expect(node.store).toHaveProperty('rule_contains')
  })

  it('awaits async rule resolution before continuing and removes messages immediately', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'required|length:5|exists|*contains:bar',
      },
      value: 'abcdef',
    })
    expect(node.store).not.toHaveProperty('rule_exists')
    expect(node.store).not.toHaveProperty('rule_contains')
    await new Promise((r) => setTimeout(r, 125))
    expect(node.store).toHaveProperty('rule_exists')
    expect(node.store).toHaveProperty('rule_contains')
    node.input('foobars', false)
    // These messages should be removed because they have been tagged with
    // 'removeImmediately' since they come on or after an async rule
    await nextTick()
    expect(node.store).not.toHaveProperty('rule_exists')
    expect(node.store).not.toHaveProperty('rule_contains')
  })

  it('cancels out mid-stream validations, never adding them', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'required|exists',
      },
      value: 'abcdef',
    })
    await nextTick()
    node.input('foo', false)
    await nextTick()
    expect(node.store).not.toHaveProperty('rule_exists')
    node.input('foobar', false)
    await new Promise((r) => setTimeout(r, 110))
    expect(node.store).not.toHaveProperty('rule_exists')
  })

  it('sets a validating message during validation runs', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'required|length:5|exists|*contains:bar',
      },
      value: 'abcdef',
    })
    // Initialize a validating counter
    node.ledger.count(
      'validating',
      (m) => m.key === 'validating' && m.type === 'state'
    )
    expect(node.store).toHaveProperty('validating')
    await node.ledger.settled('validating')
    expect(node.store).not.toHaveProperty('validating')
    node.input('foobar', false)
    await nextTick()
    expect(node.store).toHaveProperty('validating')
  })

  it('can run arbitrary validation rules', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        label: 'ABC Field',
        validation: 'abc',
        validationRules: {
          abc: ({ value }) => value === 'abc',
        },
        validationMessages: {
          abc: ({ name }) => `${name} should be 'abc'`,
        },
      },
      value: 'abcdef',
    })
    expect(node.store.rule_abc.value).toBe("ABC Field should be 'abc'")
  })

  it('can replace a validation message with a string', () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'required',
        validationMessages: {
          required: 'Fill this out!',
        },
      },
      value: '',
    })
    expect(node.store.rule_required.value).toBe('Fill this out!')
  })

  it('can re-run a rule after it has failed, passed, and then failed again', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'required',
      },
      value: 'abcdef',
    })
    expect(node.store).not.toHaveProperty('rule_required')
    node.input('', false)
    await nextTick()
    expect(node.store).toHaveProperty('rule_required')
    node.input('abc', false)
    await nextTick()
    expect(node.store).not.toHaveProperty('rule_required')
    node.input('', false)
    await nextTick()
    expect(node.store).toHaveProperty('rule_required')
  })

  it('tracks dependencies on other inputs', async () => {
    const confirm: FormKitValidationRule = vi.fn((node, address) => {
      return node.value === node.at(address)!.value
    })
    const length: FormKitValidationRule = vi.fn(
      ({ value }, length) => ('' + value).length >= parseInt(length)
    )
    const required: FormKitValidationRule = vi.fn(({ value }) => !!value)
    required.skipEmpty = false
    const validation = createValidationPlugin({
      confirm,
      length,
      required,
    })
    const parent = createNode({
      type: 'group',
      plugins: [validation],
    })
    const bar = createNode({ name: 'bar', value: 'def', parent })
    const foo = createNode({
      name: 'foo',
      value: 'abc',
      props: { validation: 'required|confirm:bar|length:20' },
      parent,
    })
    expect(foo.store).not.toHaveProperty('rule_required')
    expect(foo.store).toHaveProperty('rule_confirm')
    expect(foo.store).not.toHaveProperty('rule_length')
    expect(required).toHaveBeenCalledTimes(1)
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(length).toHaveBeenCalledTimes(0) // Should not have been called because confirm failed.
    bar.input('abc', false)
    await nextTick()
    expect(foo.store).not.toHaveProperty('rule_required')
    expect(foo.store).not.toHaveProperty('rule_confirm')
    expect(foo.store).toHaveProperty('rule_length')
    expect(required).toHaveBeenCalledTimes(2) // Should be called again, because we dont do equality comparisons (after >= beta.7)
    expect(confirm).toHaveBeenCalledTimes(2)
    expect(length).toHaveBeenCalledTimes(1) // have been should be triggered because it's state was null ie "unknown"
    foo.input('', false)
    await nextTick()
    expect(foo.store).toHaveProperty('rule_required')
    expect(foo.store).not.toHaveProperty('rule_confirm')
    expect(foo.store).not.toHaveProperty('rule_length')
  })

  it('removes validation messages that come after failing rules', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'required|exists',
        delay: 0,
      },
      value: 'abcdef',
    })
    node.input('foo', false)
    // TODO: this test failed intermittently after implementing class override system
    await new Promise((r) => setTimeout(r, 200))
    expect(node.store).toHaveProperty('rule_exists') // value is not foobar
    node.input('', false)
    await nextTick()
    expect(node.store).not.toHaveProperty('rule_exists')
  })

  it('shows forced validation messages even after a failing rule', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'length:7|*contains:hij',
      },
      value: 'abcdef',
    })
    expect(node.store).toHaveProperty('rule_length')
    expect(node.store).toHaveProperty('rule_contains')
    node.input('abcdefhij', false)
    await nextTick()
    expect(node.store).not.toHaveProperty('rule_length')
    expect(node.store).not.toHaveProperty('rule_contains')
  })

  it('removes old validations when validation prop changes', () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'length:7',
      },
      value: 'abcdef',
    })
    expect(node.store).toHaveProperty('rule_length')
    node.props.validation = 'contains:bar'
    expect(node.store).not.toHaveProperty('rule_length')
    expect(node.store).toHaveProperty('rule_contains')
  })

  it('fails multiple times with long running validation rules', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'required|length:5|longrun',
        validationRules: {
          longrun(node) {
            return new Promise<boolean>((r) => {
              setTimeout(() => {
                if (node.value !== 'barbar') return r(false)
                r(true)
              }, 100)
            })
          },
        },
      },
      value: 'foo',
    })
    expect(node.store).toHaveProperty('rule_length')
    node.input('foobar', false)
    await nextTick()
    expect(node.store).toHaveProperty('validating')
    await new Promise((r) => setTimeout(r, 120))
    expect(node.store).not.toHaveProperty('validating')
    expect(node.store).toHaveProperty('rule_longrun')
    node.input('foobars', false)
    await nextTick()
    expect(node.store).toHaveProperty('validating')
    await new Promise((r) => setTimeout(r, 120))
    expect(node.store).not.toHaveProperty('validating')
    expect(node.store).toHaveProperty('rule_longrun')
    node.input('foobarss', false)
    await nextTick()
    node.input('foo', false)
    await new Promise((r) => setTimeout(r, 200))
    expect(node.store).toHaveProperty('rule_length')
    expect(node.store).not.toHaveProperty('rule_longrun')
  })

  it('runs skipEmpty rules without preceding rules once the field has a value', async () => {
    const node = createNode({
      value: '',
      plugins: [validationPlugin],
      props: {
        validation: 'contains:foo',
        validationVisibility: 'live',
      },
    })
    expect(node.store).not.toHaveProperty('rule_contains')
    node.input('baba', false)
    await new Promise((r) => setTimeout(r, 25))
    expect(node.store).toHaveProperty('rule_contains')
  })
})

describe('getValidationMessages', () => {
  const required: FormKitValidationRule = (node) => !empty(node.value)
  required.skipEmpty = false
  const validationPlugin = createValidationPlugin({
    required,
  })

  it('extracts a single node’s errors', () => {
    const node = createNode({
      value: '',
      plugins: [validationPlugin],
      name: 'foo',
      props: {
        validation: 'required',
        validationVisibility: 'live',
      },
    })
    expect(getValidationMessages(node)).toStrictEqual(
      new Map([[node, [node.store.rule_required]]])
    )
  })

  it('extracts a group of node errors', () => {
    const node = createNode({
      value: '',
      type: 'group',
      plugins: [validationPlugin],
      name: 'form',
      children: [
        createNode({
          value: '',
          name: 'bar',
          props: {
            validation: 'required',
            validationVisibility: 'live',
          },
        }),
        createNode({
          value: '',
          name: 'bam',
          props: {
            validation: 'required',
            validationVisibility: 'live',
          },
        }),
        createNode({
          value: '',
          name: 'bim',
          props: {
            validationVisibility: 'live',
          },
        }),
      ],
    })
    expect(getValidationMessages(node)).toStrictEqual(
      new Map([
        [node.at('form.bar'), [node.at('form.bar')?.store.rule_required]],
        [node.at('form.bam'), [node.at('form.bam')?.store.rule_required]],
      ])
    )
  })

  it('does not reboot when the validation rules are the same (#514)', () => {
    // Let's pretend this is an expensive API call.
    const username_exists = vi.fn(function ({ value }: FormKitNode) {
      return new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(value === 'formkit-4-life'), 200)
      })
    })

    const node = createNode({
      value: 'foobar',
      plugins: [validationPlugin],
      props: {
        validation: 'username_exists',
        validationRules: { username_exists },
      },
    })
    expect(username_exists).toHaveBeenCalledTimes(1)
    node.props.validationRules = { username_exists }
    expect(username_exists).toHaveBeenCalledTimes(1)
  })

  it('changes the label when the prop changes', async () => {
    const length: FormKitValidationRule = vi.fn(
      ({ value }, length) => ('' + value).length >= parseInt(length)
    )
    const required: FormKitValidationRule = vi.fn(({ value }) => !!value)
    required.skipEmpty = false
    const validationPlugin = createValidationPlugin({
      length,
      required,
    })
    const hook: FormKitMiddleware<FormKitTextFragment> = (t, next) => next(t)
    const textMiddleware = vi.fn(hook)
    const node = createNode({
      value: '',
      plugins: [validationPlugin, (node) => node.hook.text(textMiddleware)],
      props: {
        label: 'Foo',
        validation: 'required',
        delay: 0,
      },
    })
    expect(node.store).toHaveProperty('rule_required')
    expect(textMiddleware).toHaveBeenCalledTimes(1)
    node.props.label = 'Bar'
    expect(textMiddleware).toHaveBeenCalledTimes(2)
    node.props.validation = 'length:7'
    expect(node.store).not.toHaveProperty('rule_required')
    node.input('123')
    await new Promise((r) => setTimeout(r, 10))
    expect(length).toHaveBeenCalledTimes(1)
    node.props.label = 'Bam'
    expect(node.store).not.toHaveProperty('rule_required')
    expect(textMiddleware).toHaveBeenCalledTimes(4)
  })

  it.only('can depend on other nodes without stopping', async () => {
    const required_if: FormKitValidationRule = vi.fn(
      (node: FormKitNode, addr: string) => {
        const other = node.at(addr)
        if (other!.value === 'foo' && node.value) {
          return true
        }
        return false
      }
    )
    required_if.skipEmpty = false
    const length: FormKitValidationRule = vi.fn(
      ({ value }, length) => ('' + value).length >= parseInt(length)
    )
    const validation = createValidationPlugin({ required_if, length })
    const form = createNode({
      type: 'group',
      children: [
        createNode({ name: 'foo' }),
        createNode({
          name: 'bar',
          value: '',
          props: { validation: 'required_if:foo|length:10' },
        }),
      ],
    })
    const bar = form.at('$self.bar')!
    bar.use(validation)
    const foo = form.at('$self.foo')!
    expect(bar.store).toHaveProperty('rule_required_if')
    expect(required_if).toHaveBeenCalledTimes(1)
    foo.input('foo', false)
    bar.input('123', false)
    await new Promise((r) => setTimeout(r, 5))
    expect(bar.store).not.toHaveProperty('rule_required_if')
    expect(required_if).toHaveBeenCalledTimes(2)
    foo.input('bar', false)
    await new Promise((r) => setTimeout(r, 5))
    expect(required_if).toHaveBeenCalledTimes(3)
    expect(bar.store).toHaveProperty('rule_required_if')
  })
})

describe('dynamic rules', () => {
  it('continues to run validation rules after they have been changes (#1155)', async () => {
    const validationPlugin = createValidationPlugin({
      match(node, value) {
        return node.value === value
      },
    })
    const node = createNode({
      value: 'initial',
      props: {
        validation: 'match:initial',
      },
      plugins: [validationPlugin],
    })
    await new Promise((r) => setTimeout(r, 10))
    expect(node.store).not.to.toHaveProperty('rule_match')
    node.props.validation = 'match:changed'
    await new Promise((r) => setTimeout(r, 10))
    expect(node.store).toHaveProperty('rule_match')
    node.input('changed', false)
    await new Promise((r) => setTimeout(r, 10))
    expect(node.store).not.toHaveProperty('rule_match')
  })
})

describe('failing message', () => {
  it('can set a failing message and remove it', async () => {
    const validationPlugin = createValidationPlugin({
      async match(node, value) {
        await new Promise((r) => setTimeout(r, 10))
        return node.value === value
      },
    })
    const node = createNode({
      value: 'foo',
      props: {
        validation: 'match:initial',
      },
      plugins: [validationPlugin],
    })
    expect(node.store).not.toHaveProperty('rule_match')
    expect(node.store).toHaveProperty('validating')
    expect(node.store.failing.value).toBe(false)
    await new Promise((r) => setTimeout(r, 20))
    expect(node.store).not.toHaveProperty('validating')
    expect(node.store).toHaveProperty('rule_match')
    expect(node.store.failing.value).toBe(true)
    node.input('bar', false)
    await new Promise((r) => setTimeout(r, 5))
    expect(node.store).toHaveProperty('validating')
    expect(node.store).not.toHaveProperty('rule_match')
    expect(node.store.failing.value).toBe(true)
    node.input('initial', false)
    await new Promise((r) => setTimeout(r, 30))
    expect(node.store).not.toHaveProperty('validating')
    expect(node.store).not.toHaveProperty('rule_match')
    expect(node.store.failing.value).toBe(false)
  })
})
