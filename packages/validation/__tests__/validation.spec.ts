import { parseRules } from '../src/validation'

describe('validation rule parsing', () => {
  it('can parse a single string rule', () => {
    const required = () => true
    expect(parseRules('required', { required })).toEqual([
      {
        rule: required,
        args: [],
        skipEmpty: true,
        force: false,
      },
    ])
  })

  it('can parse a multiple string rules', () => {
    const required = () => true
    const flavor = () => true
    expect(parseRules('required|flavor', { required, flavor })).toEqual([
      {
        rule: required,
        args: [],
        skipEmpty: true,
        force: false,
      },
      {
        rule: flavor,
        args: [],
        skipEmpty: true,
        force: false,
      },
    ])
  })

  it('can parse string arguments', () => {
    const flavor = () => true
    const before = () => true
    const flavorResult = {
      rule: flavor,
      args: ['apple', 'banana'],
      skipEmpty: true,
      force: false,
    }
    expect(parseRules('flavor:apple,banana', { flavor })).toEqual([
      flavorResult,
    ])
    expect(
      parseRules('before:10/15/2020|flavor:apple,banana', { flavor, before })
    ).toEqual([
      {
        rule: before,
        args: ['10/15/2020'],
        skipEmpty: true,
        force: false,
      },
      flavorResult,
    ])
  })

  it('can use the “force” validator hint', () => {
    const flavor = () => true
    expect(parseRules('!flavor:apple|flavor', { flavor })).toEqual([
      {
        rule: flavor,
        args: ['apple'],
        skipEmpty: true,
        force: true,
      },
      {
        rule: flavor,
        args: [],
        skipEmpty: true,
        force: false,
      },
    ])
  })

  it('leaves out validations that do not have matching rules', () => {
    const all9s = () => true
    expect(parseRules('required|all9s', { all9s })).toEqual([
      {
        rule: all9s,
        args: [],
        skipEmpty: true,
        force: false,
      },
    ])
  })

  it('preserves hints provided by the validation rule', () => {
    const required = () => true
    required.skipEmpty = false
    expect(parseRules('required', { required })).toEqual([
      {
        rule: required,
        args: [],
        skipEmpty: false,
        force: false,
      },
    ])
  })
})
