import { createNode } from '@formkit/core'
import length from '../src/length'

describe('length rule', () => {
  it('passes when using minimum string values', () => {
    expect(length(createNode({ value: 'abc' }), '3')).toBe(true)
  })

  it('fails when using minimum string values', () => {
    expect(length(createNode({ value: 'abc' }), '4')).toBe(false)
  })

  it('fails when out of bounds on the upper side', () => {
    expect(length(createNode({ value: 'abcdef' }), '1', '5')).toBe(false)
  })

  it('passes when within both bounds', () => {
    expect(length(createNode({ value: 'abcdef' }), '1', '6')).toBe(true)
  })

  it('passes when within both bounds when inverted', () => {
    expect(length(createNode({ value: 'abcdef' }), '6', '1')).toBe(true)
  })

  it('can allow an exact length', () => {
    expect(length(createNode({ value: 'abcdef' }), '6', '6')).toBe(true)
    expect(length(createNode({ value: 'abcde' }), '6', '6')).toBe(false)
    expect(length(createNode({ value: 'abcdefg' }), '6', '6')).toBe(false)
  })

  it('can validate array lengths', () => {
    expect(length(createNode({ value: [0, 1] }), '1', '2')).toBe(true)
    expect(length(createNode({ value: [0, 1, 2] }), '1', '2')).toBe(false)
    expect(length(createNode({ value: [] }), '1', '2')).toBe(false)
  })

  it('can validate object lengths', () => {
    expect(length(createNode({ value: { a: 'a' } }), '1', '2')).toBe(true)
    expect(
      length(createNode({ value: { a: 'a', b: 'b', c: 'c' } }), '1', '2')
    ).toBe(false)
    expect(length(createNode({ value: {} }), '1', '2')).toBe(false)
  })
})
