import createNode, { resetCount, useIndex } from '../src/node'
import { token } from '../src/utils'

describe('node', () => {
  it('defaults to a text node', () => {
    const node = createNode()
    expect(node.type).toBe('text')
  })

  it('allows configuration to flow to children', () => {
    const email = createNode({ name: 'email' })
    const node = createNode({
      config: {
        delimiter: '#',
      },
      children: [email],
    })
    expect(email.config.delimiter).toBe('#')
    node.config.delimiter = '$'
    expect(email.config.delimiter).toBe('$')
  })

  it('always has an __FKNode__ trap property', () => {
    const node = createNode()
    expect(node.__FKNode__).toBe(true)
  })

  it('allows registration with an arbitrary type', () => {
    const type = token()
    resetCount()
    const node = createNode({ type })
    expect(node.type).toBe(type)
    expect(node.name).toBe(`${type}_1`)
  })

  it('allows instantiation with children and sets the parent', () => {
    const group = createNode({
      type: 'group',
      children: [createNode({ type: 'email' })],
    })
    expect(group.children.size).toBe(1)
    expect(group.children.values().next().value.parent).toBe(group)
  })

  it('allows instantiation and later adding of a child', () => {
    const group = createNode({ type: 'group' })
    const element = createNode({ type: 'foobar' })
    group.add(element)
    expect(group.children.values().next().value).toBe(element)
    expect(element.parent).toBe(group)
  })

  it('can remove a child from a parent', () => {
    const group = createNode({ type: 'group' })
    const el = createNode({ type: 'foo' })
    const el2 = createNode({ type: 'bar' })
    group.add(el).add(el2)
    group.remove(el)
    expect(group.children.size).toBe(1)
    expect(el.parent).toBeNull()
  })

  it('allows a node to be moved between parents', () => {
    const el = createNode()
    const groupA = createNode({
      children: [createNode(), el],
    })
    const groupB = createNode({
      children: [createNode()],
    })
    groupB.add(el)
    expect(groupA.children.size).toBe(1)
    expect(groupB.children.size).toBe(2)
    expect(groupB.children.has(el)).toBeTruthy()
    expect(el.parent).toBe(groupB)
  })

  it('allows a node to be moved by changing the parent', () => {
    const el = createNode()
    const groupA = createNode({
      children: [createNode(), el],
    })
    const groupB = createNode({
      children: [createNode()],
    })
    el.parent = groupB
    expect(groupA.children.size).toBe(1)
    expect(groupB.children.size).toBe(2)
    expect(groupB.children.has(el)).toBeTruthy()
    expect(el.parent).toBe(groupB)
  })

  it('allows a node to be created with a parent', () => {
    const parent = createNode({ children: [createNode()] })
    const child = createNode({ parent })
    expect(parent.children.size).toBe(2)
    expect(child.parent).toBe(parent)
  })

  it('can get a node’s index', () => {
    const item = createNode()
    createNode({
      children: [createNode(), createNode(), item, createNode()],
    })
    expect(item.index).toBe(2)
  })

  it('allows changing a node’s index by directly assigning it', () => {
    const moveMe = createNode()
    const parent = createNode({
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

  it('can fetch a nested node’s address', () => {
    const email = createNode({ name: 'email' })
    createNode({
      name: 'form',
      children: [
        createNode({ name: 'input1' }),
        createNode({
          name: 'input2',
          children: [
            createNode({
              name: useIndex,
            }),
            createNode({
              name: useIndex,
              children: [email],
            }),
            createNode({
              name: useIndex,
            }),
          ],
        }),
        createNode({ name: 'input3' }),
      ],
    })
    expect(email.address).toEqual(['form', 'input2', 1, 'email'])
    const parent2 = createNode({ name: 'differentForm' })
    parent2.add(email)
    expect(email.address).toEqual(['differentForm', 'email'])
  })

  // it('allows node access using absolute path', () => {
  //   const insta = createNode({ name: 'insta' })
  //   const parent = createNode({
  //     name: 'form',
  //     children: [
  //       createNode({ name: 'username' }),
  //       createNode({ name: 'password' }),
  //       createNode({
  //         name: 'social',
  //         type: 'group',
  //         children: [
  //           createNode({
  //               type: 'wrap',
  //               name: useIndex,
  //               children: [
  //                 createNode({ name: 'twit' }),
  //                 insta,
  //                 createNode({ name: 'face' }),
  //               ]
  //           })
  //         ],
  //       }),
  //       createNode({ name: 'submit' }),
  //     ],
  //   })
  //   expect(parent.at(['form.social.0.insta'])).toBe(insta)
  // })
})

// it('allows plugins to run on node creation', () => {
//   const plugin = jest.fn()
//   const node = createNode({
//     plugins: [plugin],
//   })
// })
