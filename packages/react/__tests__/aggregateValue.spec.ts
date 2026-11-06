import { createElement as h } from 'react'
import { describe, it, expect } from 'vitest'
import { act } from '@testing-library/react'
import { getNode } from '@formkit/core'
import { FormKit } from '../src'
import { renderWithFormKit } from './helpers'

describe('group context.value (lazy clone)', () => {
  it('reflects child values, links _value after commit, and changes identity per change', async () => {
    renderWithFormKit(
      h(FormKit as any, { type: 'group', id: 'av' }, [
        h(FormKit as any, { key: 'a', name: 'a', delay: 0 }),
        h(FormKit as any, { key: 'b', name: 'b', delay: 0 }),
      ])
    )
    const g = getNode('av')!
    await g.settled
    const first = g.context!.value
    expect(first).toEqual({ a: undefined, b: undefined })
    // A clone, not the node's own object
    expect(first).not.toBe(g.value)
    expect(g.context!._value).toBe(g.context!.value)
    // Stable identity while nothing changes
    expect(g.context!.value).toBe(first)

    await act(async () => {
      g.at('a')!.input('hi')
      await g.settled
    })
    const second = g.context!.value
    expect(second).toEqual({ a: 'hi', b: undefined })
    expect(second).not.toBe(first)
    // The earlier snapshot is not mutated
    expect(first).toEqual({ a: undefined, b: undefined })
    expect(g.context!._value).toBe(second)
  })

  it('direct writes replace the cached value', async () => {
    renderWithFormKit(h(FormKit as any, { type: 'group', id: 'av2' }))
    const g = getNode('av2')!
    await g.settled
    const v = { x: 1 }
    g.context!.value = v
    expect(g.context!.value).toBe(v)
    g.context!._value = { y: 2 }
    expect(g.context!._value).toEqual({ y: 2 })
  })

  it('list values clone as arrays', async () => {
    renderWithFormKit(
      h(FormKit as any, { type: 'list', id: 'avl' }, [
        h(FormKit as any, { key: 0, value: 'a' }),
        h(FormKit as any, { key: 1, value: 'b' }),
      ])
    )
    const l = getNode('avl')!
    await l.settled
    expect(Array.isArray(l.context!.value)).toBe(true)
    expect(l.context!.value).toEqual(['a', 'b'])
    expect(l.context!.value).not.toBe(l.value)
  })
})
