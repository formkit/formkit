import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'
import contains_symbol from '../src/contains_symbol'

describe('contains_symbol', () => {
  it('passes with just symbols', () =>
    expect(contains_symbol(createNode({ value: '#$%' }))).toBe(true))

  it('passes with long string of just symbols', () =>
    expect(
      contains_symbol(createNode({ value: '#$%^&*((&^((&^$@!:"><?' }))
    ).toBe(true))

  it('passes with single symbol character', () =>
    expect(contains_symbol(createNode({ value: '$' }))).toBe(true))

  it('passes with single character in string', () =>
    expect(contains_symbol(createNode({ value: '$ejhrehjerbrbhhjbr' }))).toBe(
      true
    ))

  it('passes with one alpha', () =>
    expect(contains_symbol(createNode({ value: '%^&*(r(&^((&' }))).toBe(true))

  it('passes with one number', () =>
    expect(contains_symbol(createNode({ value: '%^&*(6(&^((&' }))).toBe(true))

  it('passes with accented character', () =>
    expect(contains_symbol(createNode({ value: '$ü^&%$' }))).toBe(true))

  it('fails with alpha only', () =>
    expect(contains_symbol(createNode({ value: 'martin' }))).toBe(false))

  it('fails with number only', () =>
    expect(contains_symbol(createNode({ value: '345654' }))).toBe(false))
})
