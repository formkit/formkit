import { deregister, get, resetRegistry } from '../src/registry'
import { createNode } from '../src/node'

describe('registry', () => {
  afterEach(() => resetRegistry())
  it('automatically registers nodes in the global registry by id', () => {
    const node = createNode({ props: { id: 'foobar' } })
    expect(get('foobar')).toBe(node)
  })

  it('does not register nodes by name', () => {
    createNode({ name: 'justin' })
    expect(get('justin')).toBe(false)
  })

  it('automatically registers root nodes by id over name', () => {
    const node = createNode({ name: 'justin', props: { id: 'boo' } })
    expect(get('justin')).toBe(false)
    expect(get('boo')).toBe(node)
  })

  it('automatically registers nodes in the global registry', () => {
    const node = createNode({ props: { id: 'foobar' } })
    expect(get('foobar')).toBe(node)
  })

  it('can remove nodes in the global registry', () => {
    const node = createNode({ props: { id: 'foobar' } })
    expect(get('foobar')).toBe(node)
    deregister(node)
    expect(get('foobar')).toBe(false)
  })
})
