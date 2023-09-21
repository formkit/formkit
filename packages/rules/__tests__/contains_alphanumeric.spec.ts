import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'
import contains_alphanumeric from '../src/contains_alphanumeric'

describe('contains_alphanumeric', () => {
  it('passes with simple string', () =>
    expect(contains_alphanumeric(createNode({ value: '567abc' }))).toBe(true))

  it('passes with long string', () =>
    expect(
      contains_alphanumeric(
        createNode({
          value: 'lkashdfla234osuihdfaisudgflaWERjsdbfla567sidufg',
        })
      )
    ).toBe(true))

  it('passes with single character', () =>
    expect(contains_alphanumeric(createNode({ value: 'z' }))).toBe(true))

  it('passes with accented character', () =>
    expect(contains_alphanumeric(createNode({ value: 'jüst56in' }))).toBe(true))

  it('passes with polish diacritic character', () =>
    expect(contains_alphanumeric(createNode({ value: 'jźąż' }))).toBe(true))

  it('passes with symbol character', () =>
    expect(contains_alphanumeric(createNode({ value: 'jhejehj$' }))).toBe(true))

  it('passes with number character', () =>
    expect(contains_alphanumeric(createNode({ value: 'jhejehj3' }))).toBe(true))

  it('passes with lots of accented characters', () =>
    expect(
      contains_alphanumeric(createNode({ value: 'àáâ7567567äïíôöÆ' }))
    ).toBe(true))

  it('passes with decimals in', () =>
    expect(contains_alphanumeric(createNode({ value: 'abcABC99.123' }))).toBe(
      true
    ))

  it('passes with lots of accented characters if invalid set', () =>
    expect(
      contains_alphanumeric(
        createNode({ value: '123123àáâäï67íôöÆ' }),
        'russian'
      )
    ).toBe(true))

  it('fails with only accented characters if latin', () =>
    expect(
      contains_alphanumeric(createNode({ value: 'àáâäïíôöÆ' }), 'latin')
    ).toBe(false))

  it('passes with accented and latin characters if latin', () =>
    expect(
      contains_alphanumeric(createNode({ value: 'àáâäïíôöÆazAZ123' }), 'latin')
    ).toBe(true))
})
