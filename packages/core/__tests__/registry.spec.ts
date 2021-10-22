import { deregister, get, resetRegistry } from '../src/registry'
import { createNode } from '../src/node'

describe('registry', () => {
  it('automatically registers nodes in the global registry by alias', () => {
    resetRegistry()
    const node = createNode({ props: { alias: 'foobar' } })
    expect(get('foobar')).toBe(node)
  })

  it('automatically registers root nodes by name', () => {
    resetRegistry()
    const node = createNode({ name: 'justin' })
    expect(get('justin')).toBe(node)
  })

  it('automatically registers root nodes by alias over name', () => {
    resetRegistry()
    const node = createNode({ name: 'justin', props: { alias: 'boo' } })
    expect(get('justin')).toBe(false)
    expect(get('boo')).toBe(node)
  })

  it('automatically registers nodes in the global registry', () => {
    resetRegistry()
    const node = createNode({ props: { alias: 'foobar' } })
    expect(get('foobar')).toBe(node)
  })

  it('can remove nodes in the global registry', () => {
    resetRegistry()
    const node = createNode({ props: { alias: 'foobar' } })
    expect(get('foobar')).toBe(node)
    deregister(node)
    expect(get('foobar')).toBe(false)
  })
})
