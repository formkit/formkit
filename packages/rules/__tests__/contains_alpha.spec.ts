import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'
import contains_alpha from '../src/contains_alpha'

describe('contains_alpha', () => {
  it('passes with simple string', () =>
    expect(contains_alpha(createNode({ value: 'abc' }))).toBe(true))

  it('passes with long string', () =>
    expect(
      contains_alpha(
        createNode({ value: 'lkashdflaosuihdfaisudgflakjsdbflasidufg' })
      )
    ).toBe(true))

  it('passes with single character', () =>
    expect(contains_alpha(createNode({ value: 'z' }))).toBe(true))

  it('passes with accented character', () =>
    expect(contains_alpha(createNode({ value: 'jüstin' }))).toBe(true))

  it('passes with polish diacritic character', () =>
    expect(contains_alpha(createNode({ value: 'bęlch' }))).toBe(true))

  it('passes with lots of accented characters', () =>
    expect(contains_alpha(createNode({ value: 'àáâäïíôöÆ' }))).toBe(true))

  it('passes with lots of accented characters if invalid set', () =>
    expect(contains_alpha(createNode({ value: 'àáâäïíôöÆ' }), 'russian')).toBe(
      true
    ))

  it('passes with numbers', () =>
    expect(contains_alpha(createNode({ value: 'justin83' }))).toBe(true))

  it('passes with symbols', () =>
    expect(contains_alpha(createNode({ value: '-justin' }))).toBe(true))

  it('fails with lots of accented characters if latin', () =>
    expect(contains_alpha(createNode({ value: 'àáâäïíôöÆ' }), 'latin')).toBe(
      false
    ))

  it('fails with numbers only', () =>
    expect(contains_alpha(createNode({ value: '5457476' }))).toBe(false))

  it('fails with symbols only', () =>
    expect(contains_alpha(createNode({ value: '-$%$#' }))).toBe(false))
})
