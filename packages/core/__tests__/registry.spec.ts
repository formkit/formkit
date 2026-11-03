import { createNode, FormKitNode } from '../src/node'
import { warningHandler } from '../src/errors'
import { warnOnDuplicateId } from '../src/duplicateIds'
import { resetRegistry, getNode, deregister } from '../src/registry'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('registry', () => {
  beforeEach(() => resetRegistry())
  it('automatically registers nodes in the global registry by id', () => {
    const node = createNode({ props: { id: 'foobar' } })
    expect(getNode('foobar')).toBe(node)
  })

  it('does not register nodes by name', () => {
    createNode({ name: 'justin' })
    expect(getNode('justin')).toBe(undefined)
  })

  it('automatically registers root nodes by id over name', () => {
    const node = createNode({ name: 'justin', props: { id: 'boo' } })
    expect(getNode('justin')).toBe(undefined)
    expect(getNode('boo')).toBe(node)
  })

  it('automatically registers nodes in the global registry', () => {
    const node = createNode({ props: { id: 'foobar' } })
    expect(getNode('foobar')).toBe(node)
  })

  it('can remove nodes in the global registry', () => {
    const node = createNode({ props: { id: 'foobar' } })
    expect(getNode('foobar')).toBe(node)
    deregister(node)
    expect(getNode('foobar')).toBe(undefined)
  })
})

describe('duplicate ids (#1412)', () => {
  it('keeps the newer node registered when an older node with the same id is destroyed', () => {
    const first = createNode({ props: { id: 'dupe-handoff' } })
    const second = createNode({ props: { id: 'dupe-handoff' } })
    expect(getNode('dupe-handoff')).toBe(second)
    first.destroy()
    expect(getNode('dupe-handoff')).toBe(second)
    second.destroy()
    expect(getNode('dupe-handoff')).toBeUndefined()
  })

  it('warns (in dev) when two live nodes share an id', async () => {
    const warning = vi.fn()
    warningHandler((w, next) => {
      if (w.code === 153) warning(w.data)
      return next(w)
    })
    const a = createNode({ props: { id: 'dupe-live' } })
    const b = createNode({ props: { id: 'dupe-live' } })
    const owns = (_n: FormKitNode) => true
    warnOnDuplicateId('dupe-live', b, a, owns)
    await new Promise((r) => setTimeout(r, 5))
    expect(warning).toHaveBeenCalledWith('dupe-live')
    a.destroy()
    b.destroy()
  })

  it('does not warn when the old node is gone before the check runs (remount)', async () => {
    const warning = vi.fn()
    warningHandler((w, next) => {
      if (w.code === 153) warning(w.data)
      return next(w)
    })
    const a = createNode({ props: { id: 'dupe-remount' } })
    const b = createNode({ props: { id: 'dupe-remount' } })
    let aAlive = true
    warnOnDuplicateId('dupe-remount', b, a, (n) => (n === a ? aAlive : true))
    a.destroy()
    aAlive = false
    await new Promise((r) => setTimeout(r, 5))
    expect(warning).not.toHaveBeenCalled()
    b.destroy()
  })
})
