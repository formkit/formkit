import max from '../src/max'
import { createNode } from '@formkit/core'

describe('max', () => {
  const node = createNode()
  it('passes when a number string', () =>
    expect(max({ value: '5', node }, '5')).toBe(true))

  it('can use a float as a max', () =>
    expect(max({ value: '5.3', node }, '5.1')).toBe(false))

  it('passes when a number', () =>
    expect(max({ value: 5, node }, 6)).toBe(true))

  it('passes when a array length', () =>
    expect(max({ value: Array(6), node }, '6')).toBe(true))

  it('fails when a array length', () =>
    expect(max({ value: Array(6), node }, '5')).toBe(false))

  it('fails when a string length', () =>
    expect(max({ value: 'bar', node }, 2)).toBe(false))

  it('fails when a number', () =>
    expect(max({ value: 10, node }, '7')).toBe(false))

  it('fails when a number', () =>
    expect(max({ value: 10, node }, '7')).toBe(false))
})
