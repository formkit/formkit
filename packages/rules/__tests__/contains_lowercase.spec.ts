import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'
import contains_lowercase from '../src/contains_lowercase'

describe('contains_lowercase', () => {
  it('passes with simple string', () =>
    expect(contains_lowercase(createNode({ value: 'abc' }))).toBe(true))

  it('passes with long string', () =>
    expect(
      contains_lowercase(
        createNode({ value: 'lkashdflaosuihdfaisudgflakjsdbflasidufg' })
      )
    ).toBe(true))

  it('passes with single character', () =>
    expect(contains_lowercase(createNode({ value: 'z' }))).toBe(true))

  it('passes with one uppercase', () =>
    expect(contains_lowercase(createNode({ value: 'mArtin' }))).toBe(true))

  it('passes with accented character', () =>
    expect(contains_lowercase(createNode({ value: 'JüSTIN' }))).toBe(true))

  it('passes with polish diacritic character', () =>
    expect(contains_lowercase(createNode({ value: 'BęLCH' }))).toBe(true))

  it('passes with lots of accented characters', () =>
    expect(contains_lowercase(createNode({ value: 'àáâäïíôöÆ' }))).toBe(true))

  it('passes with lots of accented characters if invalid set', () =>
    expect(
      contains_lowercase(createNode({ value: 'àáâäïíôöÆ' }), 'russian')
    ).toBe(true))

  it('fails with lots of accented characters if latin', () =>
    expect(
      contains_lowercase(createNode({ value: 'àáâäïíôöÆ' }), 'latin')
    ).toBe(false))

  it('fails with uppercase only', () =>
    expect(contains_lowercase(createNode({ value: 'MARTIN' }))).toBe(false))

  it('fails with symbot only', () =>
    expect(contains_lowercase(createNode({ value: '-56&54' }))).toBe(false))
})
