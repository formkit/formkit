import max from '../src/max'
import { createNode } from '@formkit/core'

describe('max', () => {
  it('passes when a number string', () =>
    expect(max(createNode({ value: '5' }), '5')).toBe(true))

  it('can use a float as a max', () =>
    expect(max(createNode({ value: '5.3' }), '5.1')).toBe(false))

  it('passes when a number', () =>
    expect(max(createNode({ value: 5 }), 6)).toBe(true))

  it('passes when a array length', () =>
    expect(max(createNode({ value: Array(6) }), '6')).toBe(true))

  it('fails when a array length', () =>
    expect(max(createNode({ value: Array(6) }), '5')).toBe(false))

  it('fails when a string length', () =>
    expect(max(createNode({ value: 'bar' }), 2)).toBe(false))

  it('fails when a number', () =>
    expect(max(createNode({ value: 10 }), '7')).toBe(false))

  it('fails when a number', () =>
    expect(max(createNode({ value: 10 }), '7')).toBe(false))
})
