import { createNode } from '@formkit/core'
import symbol from '../src/symbol'
import { describe, it, expect } from 'vitest'

describe('symbol', () => {
  it('passes with simple string', () =>
    expect(symbol(createNode({ value: '#$%' }))).toBe(true))

  it('passes with long string', () =>
    expect(symbol(createNode({ value: '#$%^&*((&^((&^$@!:"><?' }))).toBe(true))

  it('passes with single character', () =>
    expect(symbol(createNode({ value: '$' }))).toBe(true))

  it('fails with accented character', () =>
    expect(symbol(createNode({ value: '$ü^&%$' }))).toBe(false))

  it('fails with alpha only', () =>
    expect(symbol(createNode({ value: 'martin' }))).toBe(false))

  it('fails with number only', () =>
    expect(symbol(createNode({ value: '345654' }))).toBe(false))

  it('fails with one alpha', () =>
    expect(symbol(createNode({ value: '%^&*(r(&^((&' }))).toBe(false))

  it('fails with one number', () =>
    expect(symbol(createNode({ value: '%^&*(6(&^((&' }))).toBe(false))
})
