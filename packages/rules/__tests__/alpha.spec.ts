import { createNode } from '@formkit/core'
import alpha from '../src/alpha'

describe('alpha', () => {
  const node = createNode()

  it('passes with simple string', () =>
    expect(alpha({ value: 'abc', node })).toBe(true))

  it('passes with long string', () =>
    expect(
      alpha({ value: 'lkashdflaosuihdfaisudgflakjsdbflasidufg', node })
    ).toBe(true))

  it('passes with single character', () =>
    expect(alpha({ value: 'z', node })).toBe(true))

  it('passes with accented character', () =>
    expect(alpha({ value: 'jüstin', node })).toBe(true))

  it('passes with polish diacritic character', () =>
    expect(alpha({ value: 'bęlch', node })).toBe(true))

  it('passes with lots of accented characters', () =>
    expect(alpha({ value: 'àáâäïíôöÆ', node })).toBe(true))

  it('passes with lots of accented characters if invalid set', () =>
    expect(alpha({ value: 'àáâäïíôöÆ', node }, 'russian')).toBe(true))

  it('fails with lots of accented characters if latin', () =>
    expect(alpha({ value: 'àáâäïíôöÆ', node }, 'latin')).toBe(false))

  it('fails with numbers', () =>
    expect(alpha({ value: 'justin83', node })).toBe(false))

  it('fails with symbols', () =>
    expect(alpha({ value: '-justin', node })).toBe(false))
})
