import { createNode } from '@formkit/core'
import lowercase from '../src/lowercase'

describe('lowercase', () => {
  it('passes with simple string', () =>
    expect(lowercase(createNode({ value: 'abc' }))).toBe(true))

  it('passes with long string', () =>
    expect(
      lowercase(createNode({ value: 'lkashdflaosuihdfaisudgflakjsdbflasidufg' }))
    ).toBe(true))

  it('passes with single character', () =>
    expect(lowercase(createNode({ value: 'z' }))).toBe(true))

  it('passes with one uppercase', () =>
    expect(lowercase(createNode({ value: 'mArtin' }))).toBe(true))

  it('passes with accented character', () =>
    expect(lowercase(createNode({ value: 'JüSTIN' }))).toBe(true))

  it('passes with polish diacritic character', () =>
    expect(lowercase(createNode({ value: 'BęLCH' }))).toBe(true))

  it('passes with lots of accented characters', () =>
    expect(lowercase(createNode({ value: 'àáâäïíôöÆ' }))).toBe(true))

  it('passes with lots of accented characters if invalid set', () =>
    expect(lowercase(createNode({ value: 'àáâäïíôöÆ' }), 'russian')).toBe(true))

  it('fails with lots of accented characters if latin', () =>
    expect(lowercase(createNode({ value: 'àáâäïíôöÆ' }), 'latin')).toBe(false))

  it('fails with uppercase only', () =>
    expect(lowercase(createNode({ value: 'MARTIN' }))).toBe(false))

  it('fails with symbot only', () =>
    expect(lowercase(createNode({ value: '-56&54' }))).toBe(false))
})
