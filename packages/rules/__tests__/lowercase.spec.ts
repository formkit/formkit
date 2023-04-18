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

  it('fails with lots of accented characters if latin', () =>
    expect(lowercase(createNode({ value: 'àáâäïíôöæ' }), 'latin')).toBe(false))

  it('fails with uppercase only', () =>
    expect(lowercase(createNode({ value: 'MARTIN' }))).toBe(false))

  it('fails with one uppercase', () =>
    expect(lowercase(createNode({ value: 'mArtin' }))).toBe(false))

  it('fails with symbot only', () =>
    expect(lowercase(createNode({ value: '-56&54' }))).toBe(false))
})
