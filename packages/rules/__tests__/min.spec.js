import min from '../src/min'
import { createNode } from '@formkit/core'

describe('min rule', () => {
  const node = createNode()
  it('passes when a number string', () => expect(min({ value: '5', node }, '5')).toBe(true))

  it('can use a float as the min', () => expect(min({ value: '5', node }, '5.1')).toBe(false))

  it('passes when a number', () => expect(min({ value: 6, node }, 5)).toBe(true))

  it('passes when a number and string number', () => expect(min({ value: 6, node }, '5')).toBe(true))

  it('passes when a array length', () => expect(min({ value: Array(6), node }, '6')).toBe(true))

  it('fails when a array length', () => expect(min({ value: Array(6), node }, '7')).toBe(false))

  it('fails when a string length', () => expect(min({ value: 'bar', node }, 4)).toBe(false))

  it('fails when a number', () => expect(min({ value: 3, node }, '7')).toBe(false))

  it('fails when value is a non numeric string', () => expect(min({ value: 'abc', node }, 2)).toBe(false))
})
