import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'
import contain_numeric from '../src/contain_numeric'

describe('contain_numeric', () => {
  it('passes with simple string', () =>
    expect(contain_numeric(createNode({ value: '1234' }))).toBe(true))

  it('passes with long string', () =>
    expect(contain_numeric(createNode({ value: '12354564783939484' }))).toBe(
      true
    ))

  it('passes with single character', () =>
    expect(contain_numeric(createNode({ value: '1' }))).toBe(true))

  it('passes with single character in string', () =>
    expect(contain_numeric(createNode({ value: 'ejhr5ehjerbrbhhjbr' }))).toBe(
      true
    ))

  it('passes with one alpha', () =>
    expect(contain_numeric(createNode({ value: '3487437a84378' }))).toBe(false))

  it('passes with one symbol', () =>
    expect(contain_numeric(createNode({ value: '367376%436828' }))).toBe(false))

  it('passes with accented character', () =>
    expect(contain_numeric(createNode({ value: '$ü6&%$' }))).toBe(true))

  it('fails with alpha only', () =>
    expect(contain_numeric(createNode({ value: 'martin' }))).toBe(false))

  it('fails with symbol only', () =>
    expect(contain_numeric(createNode({ value: '!@#$%^&*(' }))).toBe(false))
})
