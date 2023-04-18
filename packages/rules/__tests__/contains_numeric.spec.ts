import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'
import contains_numeric from '../src/contains_numeric'

describe('contains_numeric', () => {
  it('passes with simple string', () =>
    expect(contains_numeric(createNode({ value: '1234' }))).toBe(true))

  it('passes with long string', () =>
    expect(contains_numeric(createNode({ value: '12354564783939484' }))).toBe(
      true
    ))

  it('passes with single character', () =>
    expect(contains_numeric(createNode({ value: '1' }))).toBe(true))

  it('passes with single character in string', () =>
    expect(contains_numeric(createNode({ value: 'ejhr5ehjerbrbhhjbr' }))).toBe(
      true
    ))

  it('passes with one alpha', () =>
    expect(contains_numeric(createNode({ value: '3487437a84378' }))).toBe(true))

  it('passes with one symbol', () =>
    expect(contains_numeric(createNode({ value: '367376%436828' }))).toBe(true))

  it('passes with accented character', () =>
    expect(contains_numeric(createNode({ value: '$ü6&%$' }))).toBe(true))

  it('fails with alpha only', () =>
    expect(contains_numeric(createNode({ value: 'martin' }))).toBe(false))

  it('fails with symbol only', () =>
    expect(contains_numeric(createNode({ value: '!@#$%^&*(' }))).toBe(false))
})
