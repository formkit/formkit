import { describe, it, expect, vi } from 'vitest'
import {
  createNode,
  bfs,
  FormKitNode,
  isPlaceholder,
  createPlaceholder,
  createMessage,
} from '../src'
import { clone } from '@formkit/utils'
import { createNameTree } from '.tests/helpers'

describe('lists', () => {
  it('can get a node’s index', () => {
    const item = createNode()
    createNode({
      type: 'list',
      children: [createNode(), createNode(), item, createNode()],
    })
    expect(item.index).toBe(2)
  })

  it('allows changing a node’s index by directly assigning it', () => {
    const moveMe = createNode()
    const parent = createNode({
      type: 'list',
      children: [createNode(), createNode(), moveMe, createNode()],
    })
    moveMe.index = 1
    let children = [...parent.children]
    expect(children[1]).toBe(moveMe)
    moveMe.index = 3
    children = [...parent.children]
    expect(children[3]).toBe(moveMe)
    moveMe.index = -1
    children = [...parent.children]
    expect(children[0]).toBe(moveMe)
    moveMe.index = 99
    children = [...parent.children]
    expect(children[3]).toBe(moveMe)
  })

  it('can inject a new child directly into a parent at a given index', () => {
    const list = createNode({
      type: 'list',
      children: [
        createNode({ value: 'A' }),
        createNode({ value: 'C' }),
        createNode({ value: 'D' }),
      ],
    })
    createNode({ value: 'B', parent: list, index: 1 })
    expect(list.value).toStrictEqual(['A', 'B', 'C', 'D'])
  })

  it('can inject a new child directly into a parent at a given index and inherit the value', () => {
    const A = createNode({ value: 'A' })
    const C = createNode({ value: 'C' })
    const list = createNode({
      type: 'list',
      children: [A, C],
    })
    const val = clone(list.value as string[])
    val.splice(1, 0, 'B')
    list.input(val, false)
    expect(list.value).toStrictEqual(['A', 'B', 'C'])
    const B = createNode({ value: undefined, parent: list, index: 1 })
    expect(list.value).toStrictEqual(['A', 'B', 'C'])
    expect(B.value).toBe('B')
    B.input('Z', false)
    expect(list.value).toStrictEqual(['A', 'Z', 'C'])
  })

  it('can remove a child from the list’s values', async () => {
    const food = createNode({
      type: 'list',
      children: [
        createNode({ value: 'pizza' }),
        createNode({ value: 'pasta' }),
        createNode({ value: 'steak' }),
        createNode({ value: 'fish' }),
      ],
    })
    food.remove(food.at([2])!)
    expect(food.children.length).toBe(3)
    expect(food.isSettled).toBe(true)
    expect(food.value).toStrictEqual(['pizza', 'pasta', 'fish'])
  })

  it('can remove a child from a list by destroying it', async () => {
    const repeater = createNode({
      type: 'list',
      children: [
        createNode({
          type: 'group',
          children: [createNode({ name: 'a', value: '123' })],
        }),
        createNode({
          type: 'group',
          children: [createNode({ name: 'a', value: 'abc' })],
        }),
        createNode({
          type: 'group',
          children: [createNode({ name: 'a', value: 'xyz' })],
        }),
      ],
    })
    const commitListener = vi.fn()
    repeater.on('commit', commitListener)
    repeater.at('1')?.destroy()
    await repeater.settled
    expect(repeater.children.length).toBe(2)
    expect(repeater.value).toStrictEqual([{ a: '123' }, { a: 'xyz' }])
    expect(commitListener).toHaveBeenCalledTimes(1)
  })

  it('emits a singe commit event for type list', () => {
    const commitEvent = vi.fn()
    const lib = function libraryPlugin() {}
    lib.library = (node: FormKitNode) => {
      if (node.props.type === 'list') {
        node.define({ type: 'list' })
      } else if (node.props.type === 'group') {
        node.define({ type: 'group' })
      } else {
        node.define({ type: 'input' })
      }
    }
    const node = createNode({
      props: { type: 'list' },
      plugins: [lib],
    })
    node.on('commit', commitEvent)
    const parentA = createNode({ props: { type: 'group' }, parent: node })
    const parentB = createNode({ props: { type: 'group' }, parent: node })
    const parentC = createNode({ props: { type: 'group' }, parent: node })
    createNode({
      name: 'a',
      props: { type: 'text' },
      parent: parentA,
      value: undefined,
    })
    createNode({
      name: 'b',
      props: { type: 'text' },
      parent: parentB,
      value: undefined,
    })
    createNode({
      name: 'c',
      props: { type: 'text' },
      parent: parentC,
      value: undefined,
    })
    expect(commitEvent).toHaveBeenCalledTimes(12)
    node.input([{}, {}, {}], false)
    expect(commitEvent).toHaveBeenCalledTimes(16)
  })

  it('can hydrate a list at depth', () => {
    const tree = createNode({
      type: 'group',
      name: 'form',
      value: {
        a: 'foo',
        people: ['first', 'second', 'third'],
      },
      children: [
        createNode({ name: 'a' }),
        createNode({
          name: 'people',
          type: 'list',
          children: [
            createNode(),
            createNode({ value: 'fifth' }),
            createNode(),
          ],
        }),
      ],
    })
    expect(tree.value).toStrictEqual({
      a: 'foo',
      people: ['first', 'second', 'third'],
    })
    expect(tree.at('people.0')!.value).toBe('first')
    expect(tree.at('people.1')!.value).toBe('second')
    expect(tree.at('people.2')!.value).toBe('third')
  })
})

describe('bfs', () => {
  it('searches the parent node first', () => {
    const parent = createNameTree()
    expect(bfs(parent, 'tommy')).toBe(parent)
  })

  it('searches for a name in the children', () => {
    const parent = createNameTree()
    expect(bfs(parent, 'wendy')).toBe(parent.at('wendy'))
  })

  it('allows changing the searched property', () => {
    const parent = createNameTree()
    expect(bfs(parent, '555', 'value')).toBe(parent.at('jane'))
  })

  it('allows a callback to determine the search parameters', () => {
    const parent = createNameTree()
    expect(
      bfs(
        parent,
        'radio',
        (node) => node.name !== 'jane' && node.value === '555'
      )
    ).toBe(parent.at('stella.tommy'))
  })

  it('returns undefined when unable to find a match', () => {
    const parent = createNameTree()
    expect(bfs(parent, 'jim')).toBe(undefined)
  })

  it('searches the entire tree', () => {
    const parent = createNameTree()
    const searcher = vi.fn(() => false)
    bfs(parent, 'jim', searcher)
    expect(searcher.mock.calls.length).toBe(7)
  })
})

describe('synced lists', () => {
  it('can remove a node via value in synced list', async () => {
    const nodes = [
      createNode({ value: 'A' }),
      createNode({ value: 'B' }),
      createNode({ value: 'C' }),
    ]
    const list = createNode<string[]>({
      type: 'list',
      value: ['A', 'B', 'C'],
      sync: true,
      children: nodes,
    })
    list.value.splice(1, 1)
    list.input(list.value, false)
    expect(list.value).toStrictEqual(['A', 'C'])
    await list.settled
    expect(list.children.map((child) => child.value)).toStrictEqual(['A', 'C'])
    // Even though the middle value was spliced out, all that happened was the
    // last node was removed and the values shifted.
    expect(list.children[0]).toBe(nodes[0])
    expect(list.children[1]).toBe(nodes[2])
  })

  it('can remove a node in synced list by splicing the value', async () => {
    const nodes = [
      createNode({
        type: 'group',
        children: [createNode({ name: 'x', value: 'A' })],
      }),
      createNode({
        type: 'group',
        children: [createNode({ name: 'x', value: 'B' })],
      }),
      createNode({
        type: 'group',
        children: [createNode({ name: 'x', value: 'C' })],
      }),
    ]
    const list = createNode<string[]>({
      type: 'list',
      value: [{ __key: '1' }, { __key: '2' }, { __key: '3' }],
      sync: true,
      children: nodes,
    })

    expect(list.children.map((child) => child.value)).toStrictEqual([
      { __key: '1', x: 'A' },
      { __key: '2', x: 'B' },
      { __key: '3', x: 'C' },
    ])

    list.value.splice(1, 1)
    list.input(list.value, false)
    expect(list.value).toEqual([
      { x: 'A', __key: '1' },
      { x: 'C', __key: '3' },
    ])
    await list.settled
    // Because this was a list of nodes
    expect(list.children[0]).toBe(nodes[0])
    expect(list.children[1]).toBe(nodes[2])
  })

  it('can push add a placeholder node in a synced list by pushing a value', async () => {
    const nodes = [
      createNode({
        type: 'group',
        children: [createNode({ name: 'x', value: 'A' })],
      }),
      createNode({
        type: 'group',
        children: [createNode({ name: 'x', value: 'B' })],
      }),
      createNode({
        type: 'group',
        children: [createNode({ name: 'x', value: 'C' })],
      }),
    ]
    const list = createNode<string[]>({
      type: 'list',
      value: [{ __key: '1' }, { __key: '2' }, { __key: '3' }],
      sync: true,
      children: nodes,
    })

    list.input([{}, ...list.value], false)
    expect(list.value).toEqual([
      {},
      { x: 'A', __key: '1' },
      { x: 'B', __key: '2' },
      { x: 'C', __key: '3' },
    ])
    await list.settled
    // Because this was a list of nodes
    expect(list.children[1]).toBe(nodes[0])
    expect(list.children[2]).toBe(nodes[1])
    expect(list.children[3]).toBe(nodes[2])
    expect(isPlaceholder(list.children[0])).toBe(true)
  })

  it('removes all nodes that are not in the initial values', async () => {
    const list = createNode<string[]>({
      type: 'list',
      sync: true,
      children: [createNode({ value: 'A' }), createNode({ value: 'B' })],
    })
    await list.settled
    expect(list.value).toEqual([])
    expect(list.children).toHaveLength(0)
  })

  it('can update values from a child node', async () => {
    const list = createNode<string[]>({
      type: 'list',
      sync: true,
      value: ['A', 'B'],
      children: [
        createNode({ value: 'A' }),
        createNode({ value: 'B', config: { delay: 0 } }),
      ],
    })
    await list.settled
    list.children[1].input('C')
    list.children[1].input('Cat')
    list.children[1].input('Cat in the')
    list.children[1].input('Cat in hat')
    await new Promise((r) => setTimeout(r, 20))
    expect(list.value).toEqual(['A', 'Cat in hat'])
  })

  it('can replace a placeholder node in a synced list', async () => {
    const list = createNode<string[]>({
      type: 'list',
      value: ['A', 'B'],
      sync: true,
      children: [createNode({ value: 'A' }), createNode({ value: 'B' })],
    })
    await list.settled
    expect(list.value).toEqual(['A', 'B'])
    expect(list.children.map((child) => child.value)).toEqual(['A', 'B'])
    expect(isPlaceholder(list.children[0])).toBe(false)
    list.input(['X', 'A', 'B'], false)
    expect(list.value).toEqual(['X', 'A', 'B'])
    expect(list.children.map((child) => child.value)).toEqual([
      undefined,
      'A',
      'B',
    ])
    expect(isPlaceholder(list.children[0])).toBe(true)
    const placeholderSymbol = list.children[0].uid
    createNode({ index: 0, parent: list })
    expect(list.value).toEqual(['X', 'A', 'B'])
    expect(list.children.map((child) => child.value)).toEqual(['X', 'A', 'B'])
    expect(isPlaceholder(list.children[0])).toBe(false)
    expect(placeholderSymbol).toBe(list.children[0].uid)
  })

  it('can remove the last element in a synced list', async () => {
    const list = createNode<string[]>({
      type: 'list',
      value: ['A', 'B', 'C'],
      config: {
        delay: 0,
      },
      sync: true,
    })
    await list.settled
    expect(list.value).toEqual(['A', 'B', 'C'])
    expect(list.children.length).toBe(3)
    createPlaceholder({ index: 0, parent: list })
    createPlaceholder({ index: 1, parent: list })
    createPlaceholder({ index: 2, parent: list })
    expect(list.value).toEqual(['A', 'B', 'C'])
    list.input(['A', 'B'])
    await new Promise((r) => setTimeout(r, 10))
    expect(list.value).toStrictEqual(['A', 'B'])
    expect(list.children.length).toBe(2)
  })

  it('removes ledger counts from upstream nodes when a synced node is removed', async () => {
    const list = createNode<string[]>({
      type: 'list',
      value: ['A'],
      config: {
        delay: 0,
      },
      sync: true,
    })
    await list.settled
    expect(list.value).toEqual(['A'])
    const a = createNode({ value: 'A', index: 0, parent: list })
    a.store.set(createMessage({ key: 'validation', blocking: true }))
    list.ledger.count('blocking', (m) => m.blocking)
    expect(list.ledger.value('blocking')).toBe(1)
    list.input([], false)
    expect(list.ledger.value('blocking')).toBe(0)
  })
})
