import { createNode } from '@formkit/core'
import alphanumeric from '../src/alphanumeric'

describe('alphanumeric', () => {
  it('passes with simple string', () =>
    expect(alphanumeric(createNode({ value: '567abc' }))).toBe(true))

  it('passes with long string', () =>
    expect(
      alphanumeric(
        createNode({
          value: 'lkashdfla234osuihdfaisudgflaWERjsdbfla567sidufg',
        })
      )
    ).toBe(true))

  it('passes with single character', () =>
    expect(alphanumeric(createNode({ value: 'z' }))).toBe(true))

  it('passes with accented character', () =>
    expect(alphanumeric(createNode({ value: 'jüst56in' }))).toBe(true))

  it('passes with polish diacritic character', () =>
    expect(alphanumeric(createNode({ value: 'jźąż' }))).toBe(true))

  it('passes with symbol character', () =>
    expect(alphanumeric(createNode({ value: 'jhejehj$' }))).toBe(true))

  it('passes with number character', () =>
    expect(alphanumeric(createNode({ value: 'jhejehj3' }))).toBe(true))

  it('passes with lots of accented characters', () =>
    expect(alphanumeric(createNode({ value: 'àáâ7567567äïíôöÆ' }))).toBe(true))

  it('passes with decimals in', () =>
    expect(alphanumeric(createNode({ value: 'abcABC99.123' }))).toBe(false))

  it('passes with lots of accented characters if invalid set', () =>
    expect(
      alphanumeric(createNode({ value: '123123àáâäï67íôöÆ' }), 'russian')
    ).toBe(true))

  it('fails with lots of accented characters if latin', () =>
    expect(
      alphanumeric(createNode({ value: 'àáâäï123123íôöÆ' }), 'latin')
    ).toBe(false))


})
