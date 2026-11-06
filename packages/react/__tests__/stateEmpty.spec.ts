import { createElement as h } from 'react'
import { describe, it, expect } from 'vitest'
import { act } from '@testing-library/react'
import { getNode } from '@formkit/core'
import { FormKit } from '../src'
import { renderWithFormKit } from './helpers'

describe('context.state.empty on groups (lazy)', () => {
  it('tracks the group value across inputs', async () => {
    renderWithFormKit(h(FormKit as any, { type: 'group', id: 'rg' }))
    const g = getNode('rg')!
    expect(g.context!.state.empty).toBe(true)
    await act(async () => {
      g.input({ a: 1 }, false)
      await g.settled
    })
    expect(g.context!.state.empty).toBe(false)
    await act(async () => {
      g.input({}, false)
      await g.settled
    })
    expect(g.context!.state.empty).toBe(true)
  })

  it('is false once children register their keys', async () => {
    renderWithFormKit(
      h(FormKit as any, { type: 'group', id: 'rgc' }, h(FormKit as any, { name: 'a' }))
    )
    expect(getNode('rgc')!.context!.state.empty).toBe(false)
  })
})
