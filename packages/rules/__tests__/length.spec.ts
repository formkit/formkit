import { createNode } from '@formkit/core'
import length from '../src/length'

describe('length rule', () => {
  const node = createNode()

  it('passes when using minimum string values', () => {
    expect(length({ value: 'abc', node }, '3')).toBe(true)
  })

  it('fails when using minimum string values', () => {
    expect(length({ value: 'abc', node }, '4')).toBe(false)
  })

  it('fails when out of bounds on the upper side', () => {
    expect(length({ value: 'abcdef', node }, '1', '5')).toBe(false)
  })

  it('passes when within both bounds', () => {
    expect(length({ value: 'abcdef', node }, '1', '6')).toBe(true)
  })

  it('can allow an exact length', () => {
    expect(length({ value: 'abcdef', node }, '6', '6')).toBe(true)
    expect(length({ value: 'abcde', node }, '6', '6')).toBe(false)
    expect(length({ value: 'abcdefg', node }, '6', '6')).toBe(false)
  })

  it('can validate array lengths', () => {
    expect(length({ value: [0, 1], node }, '1', '2')).toBe(true)
    expect(length({ value: [0, 1, 2], node }, '1', '2')).toBe(false)
    expect(length({ value: [], node }, '1', '2')).toBe(false)
  })

  it('can validate object lengths', () => {
    expect(length({ value: { a: 'a' }, node }, '1', '2')).toBe(true)
    expect(length({ value: { a: 'a', b: 'b', c: 'c' }, node }, '1', '2')).toBe(
      false
    )
    expect(length({ value: {}, node }, '1', '2')).toBe(false)
  })
})
