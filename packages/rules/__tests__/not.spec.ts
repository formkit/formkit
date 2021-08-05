import { createNode } from '@formkit/core'
import not from '../src/not'

describe('not rule', () => {
  it('passes when a number string', () =>
    expect(not(createNode({ value: '5' }), '6')).toBe(true))

  it('passes when a number', () =>
    expect(not(createNode({ value: 1 }), 30)).toBe(true))

  it('passes when a string', () =>
    expect(not(createNode({ value: 'abc' }), 'def')).toBe(true))

  it('fails when a shallow equal array', () =>
    expect(not(createNode({ value: ['abc'] }), ['abc'])).toBe(false))

  it('fails when a shallow equal object', () =>
    expect(
      not(createNode({ value: { a: 'abc' } }), ['123'], { a: 'abc' })
    ).toBe(false))

  it('fails when string is in stack', () =>
    expect(not(createNode({ value: 'a' }), 'b', 'c', 'd', 'a', 'f')).toBe(
      false
    ))
})
