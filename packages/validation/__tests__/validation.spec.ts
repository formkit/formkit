import { parseRules, defaultHints } from '../src/validation'

const defaultValidation = { ...defaultHints, timer: 0 }

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
        rule: free,
        name: 'free',
      },
      {
        ...defaultValidation,
        rule: required,
        name: 'required',
        args: [],
        debounce: 2000,
        blocking: false,
        force: true,
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
