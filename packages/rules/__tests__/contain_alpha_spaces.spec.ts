import { createNode } from '@formkit/core'
import alpha_spaces from '../src/alpha_spaces'

describe('alpha_spaces_spaces', () => {
  it('passes with string and spaces', () =>
    expect(alpha_spaces(createNode({ value: 'I am a string with spaces' }))).toBe(true))

  it('passes with string without spaces', () =>
    expect(alpha_spaces(createNode({ value: 'string' }))).toBe(true))

  it('passes with single character', () =>
    expect(alpha_spaces(createNode({ value: 'z' }))).toBe(true))

  it('passes with accented character', () =>
    expect(alpha_spaces(createNode({ value: 'jüstin' }))).toBe(true))

  it('passes with accented character and spaces', () =>
    expect(alpha_spaces(createNode({ value: 'jüstin ellÿ' }))).toBe(true))

  it('passes with polish diacritic character', () =>
    expect(alpha_spaces(createNode({ value: 'bęlch' }))).toBe(true))

  it('passes with polish diacritic character and spaces', () =>
    expect(alpha_spaces(createNode({ value: 'bęlch agę' }))).toBe(true))

  it('passes with lots of accented characters', () =>
    expect(alpha_spaces(createNode({ value: 'àáâäïíôöÆ' }))).toBe(true))

  it('passes with lots of accented characters if invalid set', () =>
    expect(alpha_spaces(createNode({ value: 'àáâäïíôöÆ' }), 'russian')).toBe(true))

  it('passes with numbers', () =>
    expect(alpha_spaces(createNode({ value: 'justin83' }))).toBe(true))

  it('passes with numbers and spaces', () =>
    expect(alpha_spaces(createNode({ value: '45474 83' }))).toBe(true))

  it('passes with symbols', () =>
    expect(alpha_spaces(createNode({ value: '-justin' }))).toBe(true))

  it('fails with lots of accented characters if latin', () =>
    expect(alpha_spaces(createNode({ value: 'àáâäïíôöÆ' }), 'latin')).toBe(false))

  it('fails with numbers only', () =>
    expect(alpha_spaces(createNode({ value: '5457476' }))).toBe(false))

  it('fails with symbols only', () =>
    expect(alpha_spaces(createNode({ value: '-$%$#' }))).toBe(false))
})
