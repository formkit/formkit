import { createNode } from '@formkit/core'
import between from '../src/between'
import { describe, expect, it } from 'vitest'

describe('between rule', () => {
  it('passes with simple number', () =>
    expect(between(createNode({ value: 5 }), 0, 10)).toBe(true))

  it('passes with simple number string', () =>
    expect(between(createNode({ value: '5' }), '0', '10')).toBe(true))

  it('passes with decimal number string', () =>
    expect(between(createNode({ value: '0.5' }), '0', '1')).toBe(true))

  it('fails with number to small', () =>
    expect(between(createNode({ value: 0 }), 3, 10)).toBe(false))

  it('fails with number to large', () =>
    expect(between(createNode({ value: 15 }), 3, 10)).toBe(false))

  it('passes when using upper border inclusive value', () =>
    expect(between(createNode({ value: 10 }), 1, 10)).toBe(true))

  it('passes when using lower border inclusive value', () =>
    expect(between(createNode({ value: 1 }), 1, 10)).toBe(true))

  it('passes when using lower border string inclusive value', () =>
    expect(between(createNode({ value: '5' }), '5', '5.5')).toBe(true))

  it('can pass when numbers are inverted', () => {
    expect(between(createNode({ value: '20' }), '50', '10')).toBe(true)
  })

  it('can fail when numbers are inverted', () => {
    expect(between(createNode({ value: '5' }), '50', '10')).toBe(false)
  })
})
