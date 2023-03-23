import { createNode } from '@formkit/core'
import uppercase from '../src/uppercase'

describe('uppercase', () => {
  it('passes with simple string', () =>
    expect(uppercase(createNode({ value: 'ABC' }))).toBe(true))

  it('passes with long string', () =>
    expect(
      uppercase(createNode({ value: 'GRVKTRRTKVTNWNIWOOPEDEDEDNDE' }))
    ).toBe(true))

  it('passes with single character', () =>
    expect(uppercase(createNode({ value: 'Z' }))).toBe(true))

  it('passes with one lowercase', () =>
    expect(uppercase(createNode({ value: 'MaRTIN' }))).toBe(false))

  it('passes with accented character', () =>
    expect(uppercase(createNode({ value: 'jÜstin' }))).toBe(true))

  it('passes with polish diacritic character', () =>
    expect(uppercase(createNode({ value: 'bĘlch' }))).toBe(true))

  it('passes with lots of accented characters', () =>
    expect(uppercase(createNode({ value: 'ÀÁÂÄÃÅĀÎÏÍÔÖÒ' }))).toBe(true))

  it('passes with lots of accented characters if invalid set', () =>
    expect(uppercase(createNode({ value: 'ÀÁÂÄÃÅĀÎÏÍÔÖÒ' }), 'russian')).toBe(true))

  it('fails with lots of accented characters if latin', () =>
    expect(uppercase(createNode({ value: 'ÀÁÂÄÃÅĀÎÏÍÔÖÒ' }), 'latin')).toBe(false))

  it('fails with lowercase only', () =>
    expect(uppercase(createNode({ value: 'martin' }))).toBe(false))

  it('fails with symbot only', () =>
    expect(uppercase(createNode({ value: '-56&54' }))).toBe(false))
})
