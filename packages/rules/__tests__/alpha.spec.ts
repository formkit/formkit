import { createNode } from '@formkit/core'
import alpha from '../src/alpha'

describe('alpha', () => {
  it('passes with simple string', () =>
    expect(alpha(createNode({ value: 'abc' }))).toBe(true))

  it('passes with long string', () =>
    expect(
      alpha(createNode({ value: 'lkashdflaosuihdfaisudgflakjsdbflasidufg' }))
    ).toBe(true))

  it('passes with single character', () =>
    expect(alpha(createNode({ value: 'z' }))).toBe(true))

  it('passes with accented character', () =>
    expect(alpha(createNode({ value: 'jüstin' }))).toBe(true))

  it('passes with polish diacritic character', () =>
    expect(alpha(createNode({ value: 'bęlch' }))).toBe(true))

  it('passes with lots of accented characters', () =>
    expect(alpha(createNode({ value: 'àáâäïíôöÆ' }))).toBe(true))

  it('passes with lots of accented characters if invalid set', () =>
    expect(alpha(createNode({ value: 'àáâäïíôöÆ' }), 'russian')).toBe(true))

  it('fails with lots of accented characters if latin', () =>
    expect(alpha(createNode({ value: 'àáâäïíôöÆ' }), 'latin')).toBe(false))

  it('fails with numbers', () =>
    expect(alpha(createNode({ value: 'justin83' }))).toBe(false))

  it('fails with symbols', () =>
    expect(alpha(createNode({ value: '-justin' }))).toBe(false))
})
