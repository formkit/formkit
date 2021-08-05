import { createNode } from '@formkit/core'
import is from '../src/is'

describe('is', () => {
  const node = createNode()
  it('fails when not in stack', async () => {
    expect(is({ value: 'third', node }, 'first', 'second')).toBe(false)
  })

  it('fails when case sensitive mismatch is in stack', async () => {
    expect(is({ value: 'third', node }, 'first', 'second', 'Third')).toBe(false)
  })

  it('fails comparing dissimilar objects', async () => {
    expect(is({ value: { f: 'abc' }, node }, { a: 'cdf' }, { b: 'abc' })).toBe(
      false
    )
  })

  it('passes when case sensitive match is in stack', async () => {
    expect(is({ value: 'third', node }, 'first', 'second', 'third')).toBe(true)
  })

  it('passes a shallow array compare', async () => {
    expect(is({ value: ['abc'], node }, ['cdf'], ['abc'])).toBe(true)
  })

  it('passes a shallow object compare', async () => {
    expect(is({ value: { f: 'abc' }, node }, { a: 'cdf' }, { f: 'abc' })).toBe(
      true
    )
  })
})
