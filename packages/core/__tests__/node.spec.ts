import createNode, { FormKitPlugin, useIndex } from '../src/node'
import { createTicketTree } from '../../../.jest/helpers'
import { jest } from '@jest/globals'

describe('node', () => {
  it('defaults to a text node', () => {
    const node = createNode()
    expect(node.type).toBe('input')
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

  it('does not allow the same child multiple times', () => {
    const email = createNode({ name: 'email' })
    const parent = createNode({ name: 'parent' })
    parent.add(email)
    parent.add(email)
    expect(parent.children.length).toBe(1)
  })

  it('allows configuration to flow up to parents', () => {
    const email = createNode({ name: 'email' })
    const node = createNode({
      config: {
        delimiter: '#',
      },
      children: [email],
    })
    email.config.delimiter = '$'
    expect(node.config.delimiter).toBe('$')
  })

  it('changes a child’s config when moving between trees', () => {
    const email = createNode({ name: 'email' })
    createNode({
      config: {
        delimiter: '#',
      },
      children: [email],
    })
    const parentB = createNode({
      config: {
        delimiter: '|',
      },
    })
    parentB.add(email)
    expect(email.config.delimiter).toBe('|')
  })

  it('always has an __FKNode__ trap property', () => {
    const node = createNode()
    expect(node.__FKNode__).toBe(true)
  })

  it('allows instantiation with children and sets the parent', () => {
    const group = createNode({
      type: 'group',
      children: [createNode()],
    })
    expect(group.children.length).toBe(1)
    expect(group.children.values().next().value.parent).toBe(group)
  })

  it('allows instantiation and later adding of a child', () => {
    const group = createNode({ type: 'group' })
    const element = createNode()
    group.add(element)
    expect(group.children.values().next().value).toBe(element)
    expect(element.parent).toBe(group)
  })

  it('can remove a child from a parent', () => {
    const group = createNode({ type: 'group' })
    const el = createNode()
    const el2 = createNode()
    group.add(el).add(el2)
    group.remove(el)
    expect(group.children.length).toBe(1)
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
    expect(groupA.children.length).toBe(1)
    expect(groupB.children.length).toBe(2)
    expect(groupB.children.includes(el)).toBeTruthy()
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
    expect(groupA.children.length).toBe(1)
    expect(groupB.children.length).toBe(2)
    expect(groupB.children.includes(el)).toBeTruthy()
    expect(el.parent).toBe(groupB)
  })

  it('allows a node to be created with a parent', () => {
    const parent = createNode({ children: [createNode()] })
    const child = createNode({ parent })
    expect(parent.children.length).toBe(2)
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

  it('can always reference the root', () => {
    const nestedChild = createNode()
    const parent = createNode()
    const L1 = createNode({
      children: [
        createNode({}),
        createNode({}),
        createNode({
          children: [nestedChild],
        }),
      ],
    })
    parent.add(L1)
    expect(nestedChild.root).toBe(parent)
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

  it('allows node traversal using path', () => {
    const insta = createNode({ name: 'insta' })
    const password = createNode({ name: 'password' })
    const parent = createNode({
      name: 'form',
      children: [
        createNode({ name: 'username' }),
        password,
        createNode({
          name: 'social',
          type: 'group',
          children: [
            createNode({
              type: 'group',
              name: useIndex,
              children: [
                createNode({ name: 'twit' }),
                insta,
                createNode({ name: 'face' }),
              ],
            }),
            createNode({
              type: 'group',
              name: useIndex,
              children: [
                createNode({ name: 'twit' }),
                createNode({ name: 'insta', value: 456 }),
                createNode({ name: 'face' }),
              ],
            }),
          ],
        }),
        createNode({ name: 'submit' }),
      ],
    })
    expect(parent.at('social.0.insta')).toBe(insta)
    expect(parent.at('form.social.0.insta')).toBe(insta)
    expect(parent.at(['password'])).toBe(password)
    expect(parent.at(['social', 1, 'insta'])?.value).toBe(456)
    expect(parent.at(insta.address)).toBe(insta)
  })

  it('uses the $root keyword to allow root access via address', () => {
    const [parent, nestedChild] = createTicketTree()
    expect(nestedChild.at('$root')).toBe(parent)
  })

  it('uses the $parent keyword to allow address backtracking', () => {
    const [, nestedChild] = createTicketTree()
    expect(nestedChild.at('$parent.$parent.0.price')?.value).toBe(499)
  })

  it('removes the first $parent of any address', () => {
    const [root] = createTicketTree()
    const email = root.at('email')
    expect(email?.at('$parent.password')).toBe(email?.at('password'))
  })

  it('can reference $self and $self children', () => {
    const [root] = createTicketTree()
    const tickets = root.at('tickets')
    expect(tickets?.at('$self.0.price')?.value).toBe(499)
  })

  it('can find a node in a subtree by name', () => {
    const [root, nestedChild] = createTicketTree()
    expect(root.find('seat')).toBe(nestedChild)
  })

  it('can find a node in a subtree by name via address', () => {
    const [root, nestedChild] = createTicketTree()
    expect(root.at(['find(seat)'])).toBe(nestedChild)
  })

  it('can find a node in a subtree by type', () => {
    const [root, nestedChild] = createTicketTree()
    const row = nestedChild.at('$parent.$parent.find(555, value)')
    expect(row).toBeTruthy()
    expect(row).toBe(root.at('tickets.0.row'))
  })
})

describe('plugin system', () => {
  it('runs plugins on node creation', () => {
    const plugin = jest.fn(() => {})
    const node = createNode({
      plugins: [plugin],
    })
    expect(plugin).toHaveBeenLastCalledWith(node)
  })

  it('automatically inherits from parent plugins', () => {
    const pluginA = jest.fn(() => {})
    const pluginB = jest.fn(() => {})
    const parent = createNode({
      plugins: [pluginA],
    })
    const child = createNode({
      parent,
      plugins: [pluginB],
    })
    expect(pluginB).toBeCalledTimes(1)
    expect(pluginA).toBeCalledTimes(2)
    expect(pluginB).toHaveBeenCalledWith(child)
    expect(pluginA).toHaveBeenNthCalledWith(2, child)
  })

  it('runs inherited plugins when being added to a tree', () => {
    const pluginA = jest.fn(() => {})
    const pluginB = jest.fn(() => {})
    createNode({
      plugins: [pluginA],
      children: [
        createNode(),
        createNode({ plugins: [pluginB] }),
        createNode(),
      ],
    })
    expect(pluginA).toBeCalledTimes(4)
    expect(pluginB).toBeCalledTimes(1)
  })

  it('inherits the plugins when moving between trees', () => {
    const pluginA = jest.fn(() => {})
    const pluginB = jest.fn(() => {})
    const treeA = createNode({
      plugins: [pluginA],
    })
    const treeB = createNode({
      plugins: [pluginB],
    })
    const child = createNode({ parent: treeA })
    expect(pluginA).toHaveBeenCalledTimes(2)
    child.parent = treeB
    expect(pluginB).toHaveBeenCalledTimes(2)
    expect(child.plugins).toEqual(new Set([pluginA, pluginB]))
  })

  it('does not re-run plugins when moving position in tree', () => {
    const pluginA = jest.fn(() => {})
    const child = createNode()
    const treeA = createNode({
      plugins: [pluginA],
      children: [
        createNode(),
        createNode({
          name: 'group',
          children: [createNode()],
        }),
        child,
      ],
    })
    expect(pluginA).toHaveBeenCalledTimes(5)
    treeA.at('group')?.add(child)
    expect(pluginA).toHaveBeenCalledTimes(5)
  })

  it('throws an exception if you try to manually change the plugins', () => {
    const node = createNode()
    expect(() => {
      node.plugins = new Set()
    }).toThrow()
  })
})

describe('init hook', () => {
  it('can modify a node on creation', () => {
    const envPlugin: FormKitPlugin<any> = function (node) {
      node.hook.init((n, next) => {
        n.input(123)
        return next()
      })
    }
    const form = createNode({
      plugins: [envPlugin],
    })
    const input = createNode({ parent: form })
    expect(input.value).toBe(123)
  })
})

describe('input hook', () => {
  it('can set the value of a node', () => {
    const node = createNode({ value: 'hello pluto' })
    node.input('hello world')
    expect(node.value).toBe('hello world')
  })
})

// describe('commit hook', () => {
//   it('can change the value being assigned', () => {
//     const phonePlugin: FormKitPlugin = function (node) {
//       if (node.type === 'phone') {
//         node.hook.commit((value, next) => {
//           const digits = value.replaceAll(/[^0-9]/g, '')
//           let phone = ''
//           if (digits.length >= 3) {
//             phone = `(${digits.substr(0, 3)}) `
//           }
//           if (digits.length >= 6) {
//             phone += `${digits.substr(3, 3)}-${digits.substr(6)}`
//           }
//           if (digits.length < 3) {
//             phone = digits
//           }
//           return next(phone)
//         })
//       }
//     }
//   })
// })
