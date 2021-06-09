import { createNameTree } from '../../../.jest/helpers'
import { bfs } from '../src/utils'
import { FormKitNode } from '../src/node'
import { jest } from '@jest/globals'

describe('bfs', () => {
  it('searches the parent node first', () => {
    const parent = createNameTree()
    expect(bfs(parent, 'tommy')).toBe(parent)
  })

  it('searches the parent node first', () => {
    const parent = createNameTree()
    expect(bfs(parent, 'wendy')).toBe(parent.at('wendy'))
  })

  it('allows changing the searched property', () => {
    const parent = createNameTree()
    expect(bfs(parent, 'radio', 'type')).toBe(parent.at('jane'))
  })

  it('allows a callback to determine the search parameters', () => {
    const parent = createNameTree()
    expect(
      bfs(
        parent,
        'radio',
        (node) => node.name !== 'jane' && node.type === 'radio'
      )
    ).toBe(parent.at('stella.tommy'))
  })

  it('returns undefined when unable to find a match', () => {
    const parent = createNameTree()
    expect(bfs(parent, 'jimbo')).toBe(undefined)
  })

  it('searches the entire tree', () => {
    const parent = createNameTree()
    const searcher = jest.fn((_node: FormKitNode) => false)
    bfs(parent, 'jimbo', searcher)
    expect(searcher.mock.calls.length).toBe(7)
  })
})
