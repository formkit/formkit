import { createNode } from '@formkit/core'
import not from '../src/not'

describe('not rule', () => {
  const node = createNode()
  it('passes when a number string', () =>
    expect(not({ value: '5', node }, '6')).toBe(true))

  it('passes when a number', () =>
    expect(not({ value: 1, node }, 30)).toBe(true))

  it('passes when a string', () =>
    expect(not({ value: 'abc', node }, 'def')).toBe(true))

  it('fails when a shallow equal array', () =>
    expect(not({ value: ['abc'], node }, ['abc'])).toBe(false))

  it('fails when a shallow equal object', () =>
    expect(not({ value: { a: 'abc' }, node }, ['123'], { a: 'abc' })).toBe(
      false
    ))

  it('fails when string is in stack', () =>
    expect(not({ value: 'a', node }, 'b', 'c', 'd', 'a', 'f')).toBe(false))
})
