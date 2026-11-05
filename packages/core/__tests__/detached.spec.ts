import { describe, it, expect, vi } from 'vitest'
import { createNode, getNode } from '../src'

describe('detached nodes', () => {
  it('inherits config and plugins but does not join the parent', () => {
    const seen = vi.fn()
    const plugin = (node: any) => {
      seen(node.name)
    }
    const form = createNode({
      type: 'group',
      name: 'form',
      plugins: [plugin],
      config: { delay: 5, locale: 'fr' },
    })
    const child = createNode({
      name: 'email',
      value: 'a@b.co',
      parent: form,
      detached: true,
    })
    expect(child.parent).toBe(null)
    expect(form.children).not.toContain(child)
    expect(form.value).toEqual({})
    // inherited config + plugin
    expect(child.props.locale).toBe('fr')
    expect(seen).toHaveBeenCalledWith('email')
  })

  it('a discarded detached node leaves the parent untouched', async () => {
    const form = createNode({ type: 'group', name: 'form' })
    createNode({ name: 'email', value: 'ghost', parent: form, detached: true })
    const real = createNode({ name: 'email', value: 'real', parent: form })
    await form.settled
    expect(form.children).toHaveLength(1)
    expect(form.value).toEqual({ email: 'real' })
    expect(real.parent).toBe(form)
  })

  it('attaches with parent.add() and only then registers its id', async () => {
    const form = createNode({ type: 'group', name: 'form' })
    const child = createNode({
      name: 'email',
      value: 'a@b.co',
      parent: form,
      detached: true,
      props: { id: 'detached-email' },
    })
    expect(getNode('detached-email')).toBe(undefined)
    form.add(child)
    await form.settled
    expect(child.parent).toBe(form)
    expect(form.value).toEqual({ email: 'a@b.co' })
    expect(getNode('detached-email')).toBe(child)
    child.input('x@y.co', false)
    expect(form.value).toEqual({ email: 'x@y.co' })
  })

  it('applies parent plugins only once across creation and attach', () => {
    const calls = vi.fn()
    const plugin = () => {
      calls()
    }
    const form = createNode({ type: 'group', plugins: [plugin] })
    calls.mockClear()
    const child = createNode({ name: 'a', parent: form, detached: true })
    form.add(child)
    expect(calls).toHaveBeenCalledTimes(1)
  })
})
