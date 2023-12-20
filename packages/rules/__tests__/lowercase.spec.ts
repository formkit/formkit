import { createNode } from '@formkit/core'
import lowercase from '../src/lowercase'
import { describe, it, expect } from 'vitest'

describe('lowercase', () => {
  it('passes with simple string', () =>
    expect(lowercase(createNode({ value: 'abc' }))).toBe(true))

  it('passes with long string', () =>
    expect(
      lowercase(
        createNode({ value: 'lkashdflaosuihdfaisudgflakjsdbflasidufg' })
      )
    ).toBe(true))

  it('passes with single character', () =>
    expect(lowercase(createNode({ value: 'z' }))).toBe(true))

  it('passes with accented character', () =>
    expect(lowercase(createNode({ value: 'ü' }))).toBe(true))

  it('passes with polish diacritic character', () =>
    expect(lowercase(createNode({ value: 'ę' }))).toBe(true))

  it('passes with lots of accented characters', () =>
    expect(lowercase(createNode({ value: 'àáâäïíôöæ' }))).toBe(true))

  it('passes with lots of accented characters if invalid set', () =>
    expect(lowercase(createNode({ value: 'àáâäïíôöæ' }), 'russian')).toBe(true))

  it('passes with numbers & symbols when using allow_non_alpha modifier', () =>
    expect(lowercase(createNode({ value: 'abc1234567890#$%^&*((&^((&^$@!:"><?' }), 'allow_non_alpha')).toBe(true))

  it('passes with numbers when using allow_numeric modifier', () =>
    expect(lowercase(createNode({ value: 'abc1234567890' }), 'allow_non_alpha')).toBe(true))

  it('passes with numbers and dashes when using allow_numeric modifier', () =>
    expect(lowercase(createNode({ value: 'abc1234567890-' }), 'allow_numeric_dashes')).toBe(true))

  it('passes with numbers and many dashes when using allow_numeric modifier', () =>
    expect(lowercase(createNode({ value: '-abc12-34-56-78-90-' }), 'allow_numeric_dashes')).toBe(true))

  it('fails with lots of accented characters if latin', () =>
    expect(lowercase(createNode({ value: 'àáâäïíôöæ' }), 'latin')).toBe(false))

  it('fails with uppercase only', () =>
    expect(lowercase(createNode({ value: 'MARTIN' }))).toBe(false))

  it('fails with one uppercase', () =>
    expect(lowercase(createNode({ value: 'mArtin' }))).toBe(false))

  it('fails with symbot only', () =>
    expect(lowercase(createNode({ value: '-56&54' }))).toBe(false))

  it('fails with uppercase allow_non_alpha modifier', () =>
    expect(lowercase(createNode({ value: 'Aabc1234567890#$%^&*((&^((&^$@!:"><?' }), 'allow_non_alpha')).toBe(false))

  it('fails with uppercase when using allow_numeric modifier', () =>
    expect(lowercase(createNode({ value: 'aBc1234567890' }), 'allow_non_alpha')).toBe(false))

  it('fails with uppercase when using allow_numeric modifier', () =>
    expect(lowercase(createNode({ value: 'AbC1234567890-' }), 'allow_numeric_dashes')).toBe(false))

  it('fails with uppercase when using allow_numeric modifier', () =>
    expect(lowercase(createNode({ value: '-aBcmArtin12-34-56-78-90-' }), 'allow_numeric_dashes')).toBe(false))
})
