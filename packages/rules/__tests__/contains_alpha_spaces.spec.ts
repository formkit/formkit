import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'
import contains_alpha_spaces from '../src/contains_alpha_spaces'

describe('contains_alpha_spaces_spaces', () => {
  it('passes with string and spaces', () =>
    expect(
      contains_alpha_spaces(createNode({ value: 'I am a string with spaces' }))
    ).toBe(true))

  it('passes with string without spaces', () =>
    expect(contains_alpha_spaces(createNode({ value: 'string' }))).toBe(true))

  it('passes with single character', () =>
    expect(contains_alpha_spaces(createNode({ value: 'z' }))).toBe(true))

  it('passes with accented character', () =>
    expect(contains_alpha_spaces(createNode({ value: 'jüstin' }))).toBe(true))

  it('passes with accented character and spaces', () =>
    expect(contains_alpha_spaces(createNode({ value: 'jüstin ellÿ' }))).toBe(
      true
    ))

  it('passes with polish diacritic character', () =>
    expect(contains_alpha_spaces(createNode({ value: 'bęlch' }))).toBe(true))

  it('passes with polish diacritic character and spaces', () =>
    expect(contains_alpha_spaces(createNode({ value: 'bęlch agę' }))).toBe(
      true
    ))

  it('passes with lots of accented characters', () =>
    expect(contains_alpha_spaces(createNode({ value: 'àáâäïíôöÆ' }))).toBe(
      true
    ))

  it('passes with lots of accented characters if invalid set', () =>
    expect(
      contains_alpha_spaces(createNode({ value: 'àáâäïíôöÆ' }), 'russian')
    ).toBe(true))

  it('passes with numbers', () =>
    expect(contains_alpha_spaces(createNode({ value: 'justin83' }))).toBe(true))

  it('passes with numbers and spaces', () =>
    expect(contains_alpha_spaces(createNode({ value: '45474 83' }))).toBe(true))

  it('passes with symbols', () =>
    expect(contains_alpha_spaces(createNode({ value: '-justin' }))).toBe(true))

  it('fails with lots of accented characters if latin', () =>
    expect(
      contains_alpha_spaces(createNode({ value: 'àáâäïíôöÆ' }), 'latin')
    ).toBe(false))

  it('fails with numbers only', () =>
    expect(contains_alpha_spaces(createNode({ value: '5457476' }))).toBe(false))

  it('fails with symbols only', () =>
    expect(contains_alpha_spaces(createNode({ value: '-$%$#' }))).toBe(false))
})
