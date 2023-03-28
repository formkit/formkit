import min from '../src/min'
import { createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'

describe('min rule', () => {
  it('passes when a number string', () =>
    expect(min(createNode({ value: '5' }), '5')).toBe(true))

  it('can use a float as the min', () =>
    expect(min(createNode({ value: '5' }), '5.1')).toBe(false))

  it('passes when a number', () =>
    expect(min(createNode({ value: 6 }), 5)).toBe(true))

  it('fails multi-digit numbers', () =>
    expect(min(createNode({ value: '4' }), '10')).toBe(false))

  it('passes when a number and string number', () =>
    expect(min(createNode({ value: 6 }), '5')).toBe(true))

  it('passes when a array length', () =>
    expect(min(createNode({ value: Array(6) }), '6')).toBe(true))

  it('fails when a array length', () =>
    expect(min(createNode({ value: Array(6) }), '7')).toBe(false))

  it('fails when a string length', () =>
    expect(min(createNode({ value: 'bar' }), 4)).toBe(false))

  it('fails when a number', () =>
    expect(min(createNode({ value: 3 }), '7')).toBe(false))

  it('fails when value is a non numeric string', () =>
    expect(min(createNode({ value: 'abc' }), 2)).toBe(false))
})
