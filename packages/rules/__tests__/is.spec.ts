import { createNode } from '@formkit/core'
import is from '../src/is'

describe('is', () => {
  it('fails when not in stack', async () => {
    expect(is(createNode({ value: 'third' }), 'first', 'second')).toBe(false)
  })

  it('fails when case sensitive mismatch is in stack', async () => {
    expect(is(createNode({ value: 'third' }), 'first', 'second', 'Third')).toBe(
      false
    )
  })

  it('fails comparing dissimilar objects', async () => {
    expect(
      is(createNode({ value: { f: 'abc' } }), { a: 'cdf' }, { b: 'abc' })
    ).toBe(false)
  })

  it('passes when case sensitive match is in stack', async () => {
    expect(is(createNode({ value: 'third' }), 'first', 'second', 'third')).toBe(
      true
    )
  })

  it('passes a shallow array compare', async () => {
    expect(is(createNode({ value: ['abc'] }), ['cdf'], ['abc'])).toBe(true)
  })

  it('passes a shallow object compare', async () => {
    expect(
      is(createNode({ value: { f: 'abc' } }), { a: 'cdf' }, { f: 'abc' })
    ).toBe(true)
  })
})
