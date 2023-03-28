import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'
import contains_uppercase from '../src/contains_uppercase'

describe('contains_uppercase', () => {
  it('passes with simple string', () =>
    expect(contains_uppercase(createNode({ value: 'ABC' }))).toBe(true))

  it('passes with long string', () =>
    expect(
      contains_uppercase(createNode({ value: 'GRVKTRRTKVTNWNIWOOPEDEDEDNDE' }))
    ).toBe(true))

  it('passes with single character', () =>
    expect(contains_uppercase(createNode({ value: 'Z' }))).toBe(true))

  it('passes with one lowercase', () =>
    expect(contains_uppercase(createNode({ value: 'MaRTIN' }))).toBe(true))

  it('passes with accented character', () =>
    expect(contains_uppercase(createNode({ value: 'jÜstin' }))).toBe(true))

  it('passes with polish diacritic character', () =>
    expect(contains_uppercase(createNode({ value: 'bĘlch' }))).toBe(true))

  it('passes with lots of accented characters', () =>
    expect(contains_uppercase(createNode({ value: 'ÀÁÂÄÃÅĀÎÏÍÔÖÒ' }))).toBe(
      true
    ))

  it('passes with lots of accented characters if invalid set', () =>
    expect(
      contains_uppercase(createNode({ value: 'ÀÁÂÄÃÅĀÎÏÍÔÖÒ' }), 'russian')
    ).toBe(true))

  it('fails with lots of accented characters if latin', () =>
    expect(
      contains_uppercase(createNode({ value: 'ÀÁÂÄÃÅĀÎÏÍÔÖÒ' }), 'latin')
    ).toBe(false))

  it('fails with lowercase only', () =>
    expect(contains_uppercase(createNode({ value: 'martin' }))).toBe(false))

  it('fails with symbot only', () =>
    expect(contains_uppercase(createNode({ value: '-56&54' }))).toBe(false))
})
