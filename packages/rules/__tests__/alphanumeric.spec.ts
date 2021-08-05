import { createNode } from '@formkit/core'
import alphanumeric from '../src/alphanumeric'

describe('alphanumeric', () => {
  const node = createNode()

  it('passes with simple string', () =>
    expect(alphanumeric({ value: '567abc', node })).toBe(true))

  it('passes with long string', () =>
    expect(
      alphanumeric({
        value: 'lkashdfla234osuihdfaisudgflakjsdbfla567sidufg',
        node,
      })
    ).toBe(true))

  it('passes with single character', () =>
    expect(alphanumeric({ value: 'z', node })).toBe(true))

  it('passes with accented character', () =>
    expect(alphanumeric({ value: 'jüst56in', node })).toBe(true))

  it('passes with polish diacritic character', () =>
    expect(alphanumeric({ value: 'jźąż', node })).toBe(true))

  it('passes with lots of accented characters', () =>
    expect(alphanumeric({ value: 'àáâ7567567äïíôöÆ', node })).toBe(true))

  it('passes with lots of accented characters if invalid set', () =>
    expect(alphanumeric({ value: '123123àáâäï67íôöÆ', node }, 'russian')).toBe(
      true
    ))

  it('fails with lots of accented characters if latin', () =>
    expect(alphanumeric({ value: 'àáâäï123123íôöÆ', node }, 'latin')).toBe(
      false
    ))

  it('fails with decimals in', () =>
    expect(alphanumeric({ value: 'abcABC99.123', node })).toBe(false))
})
