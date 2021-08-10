import { empty } from '@formkit/utils'
import {
  parseRules,
  defaultHints,
  createValidationPlugin,
  FormKitValidationRule,
} from '../src/validation'
import { createNode } from '@formkit/core'

const defaultValidation = { ...defaultHints, timer: 0 }
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
    expect(parseRules('^flavor:apple|flavor', { flavor })).toEqual([
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
    expect(parseRules('^required', { required })).toEqual([
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
    expect(parseRules('^?required', { required })).toEqual(result)
    expect(parseRules('?^required', { required })).toEqual(result)
  })

  it('can parse debounce hints in the middle', () => {
    const required = () => true
    required.force = false
    expect(parseRules('^(200)?required', { required })).toEqual([
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
    expect(parseRules('(5)^?required', { required })).toEqual([
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
    expect(parseRules('^?(999)required', { required })).toEqual([
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
      parseRules([['required'], ['^party', 'arg1', 'arg2']], {
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
    const parsed = parseRules([['^matches', /^S.*$/]], { matches })
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
          resolve(['bar', 'foobar'].includes(value))
        }, 100)
      )
    },
  })

  it('runs non-async non-debounced rules synchronously with bailing', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'required|length:5|contains:bar',
      },
      value: '',
    })
    await nextTick()
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
        validation: 'required|(200)length:5|^contains:bar',
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
        validation: 'required|length:5|exists|^contains:bar',
      },
      value: 'abcdef',
    })
    await nextTick()
    expect(node.store).not.toHaveProperty('rule_exists')
    expect(node.store).not.toHaveProperty('rule_contains')
    await new Promise((r) => setTimeout(r, 105))
    expect(node.store).toHaveProperty('rule_exists')
    expect(node.store).toHaveProperty('rule_contains')
    node.input('foobars', false)
    // These messages should be removed because they have been tagged with
    // 'removeImmediately' since they come on or after an async rule
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
    await new Promise((r) => setTimeout(r, 103))
    expect(node.store).not.toHaveProperty('rule_exists')
  })

  it('sets a validating message during validation runs', async () => {
    const node = createNode({
      plugins: [validationPlugin],
      props: {
        validation: 'required|length:5|exists|^contains:bar',
      },
      value: 'abcdef',
    })
    expect(node.store).toHaveProperty('validating')
    await node.ledger.settled('validating')
    expect(node.store).not.toHaveProperty('validating')
    node.input('foobar', false)
    expect(node.store).toHaveProperty('validating')
  })
})
