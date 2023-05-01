import { describe, it, expect, vi } from 'vitest'
import { createNode, bfs, FormKitNode } from '../src'
import { clone } from '@formkit/utils'
import { createNameTree } from '.jest/helpers'

describe('lists', () => {
  it('can get a node’s index', () => {
    const item = createNode()
    createNode({
      type: 'list',
      children: [createNode(), createNode(), item, createNode()],
    })
    expect(item.index).toBe(2)
  })

  it('can remove a node via value', async () => {
    const nodes = [
      createNode({ value: 'A' }),
      createNode({ value: 'B' }),
      createNode({ value: 'C' }),
    ]
    const list = createNode<string[]>({
      type: 'list',
      sync: true,
      children: nodes,
    })
    list.value.splice(1, 1)
    list.input(list.value)
    expect(list.value).toStrictEqual(['A', 'C'])
    await list.settled
    expect(list.children.map((child) => child.value)).toEqual(['A', 'C'])
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
    expect(commitEvent).toHaveBeenCalledTimes(9)
    node.input([{}, {}, {}], false)
    expect(commitEvent).toHaveBeenCalledTimes(13)
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
