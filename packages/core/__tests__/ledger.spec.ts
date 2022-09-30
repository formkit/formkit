import { createShippingTree, createTicketTree } from '../../../.jest/helpers'
import { createNode } from '../src/node'
import { getNode } from '../src/registry'
import { createMessage } from '../src/store'
import { jest } from '@jest/globals'
import { token } from '@formkit/utils'

const nextTick = () => new Promise((r) => setTimeout(r, 0))

describe('ledger tracking on single node', () => {
  it('automatically resolves when no matching ledger is found', () => {
    const node = createNode()
    expect(node.ledger.settled('party')).toBeInstanceOf(Promise)
  })

  it('does not resolve until ledger is settled', async () => {
    const braveHeart = createNode()
    braveHeart.ledger.count('braveheart')
    braveHeart.store.set(
      createMessage({
        key: 'freedom',
        type: 'braveheart',
      })
    )
    expect(braveHeart.ledger.value('braveheart')).toBe(1)
    const whenSettled = jest.fn()
    braveHeart.ledger.settled('braveheart').then(whenSettled)
    braveHeart.store.set(
      createMessage({
        key: 'freedom-2',
        type: 'braveheart',
      })
    )
    await nextTick()
    expect(whenSettled).toHaveBeenCalledTimes(0)
    braveHeart.store.remove('freedom')
    expect(whenSettled).toHaveBeenCalledTimes(0)
    braveHeart.store.remove('freedom-2')
    await nextTick()
    expect(whenSettled).toHaveBeenCalledTimes(1)
  })
})

describe('ledger tracking on a tree', () => {
  it('accumulates tracking data at the top of the tree', async () => {
    const [tree] = createTicketTree()
    tree.ledger.count('errors', (m) => m.type === 'errors')
    tree.at('form.confirm_password')!.store.set(
      createMessage({
        key: 'error-422',
        type: 'errors',
      })
    )
    tree.store.set(
      createMessage({
        key: 'error-422',
        type: 'errors',
      })
    )
    tree.at('form.tickets.0.row')!.store.set(
      createMessage({
        key: 'error-422',
        type: 'errors',
      })
    )
    const settledListener = jest.fn()
    tree.ledger.settled('errors').then(settledListener)
    await nextTick()
    expect(settledListener).toHaveBeenCalledTimes(0)
    expect(tree.ledger.value('errors')).toBe(3)
    tree.store.remove('error-422')
    expect(tree.ledger.value('errors')).toBe(2)
    tree.at('form.tickets.0.row')!.store.remove('error-422')
    expect(tree.ledger.value('errors')).toBe(1)
    tree.at('form.confirm_password')!.store.remove('error-422')
    await nextTick()
    expect(settledListener).toHaveBeenCalledTimes(1)
  })

  it('can filter tracking to blocking messages only', () => {
    const [tree] = createTicketTree()
    tree.ledger.count(
      'blocking_errors',
      (m) => m.type === 'errors' && m.blocking
    )
    tree.at('form.confirm_password')!.store.set(
      createMessage({
        key: 'error-422',
        type: 'errors',
      })
    )
    tree.store.set(
      createMessage({
        key: 'error-422',
        type: 'errors',
        blocking: true,
      })
    )
    expect(tree.ledger.value('blocking_errors')).toBe(1)
  })

  it('counts the current value of a store when added', () => {
    const node = createNode()
    node.store.set(
      createMessage({
        type: 'bubbles',
        key: 'bubble-1',
      })
    )
    node.store.set(
      createMessage({
        type: 'validation',
        key: 'required_rule',
      })
    )
    node.ledger.count('bubbles', (m) => m.type === 'bubbles')
    expect(node.ledger.value('bubbles')).toBe(1)
  })

  it('counts the current value of a tree when added', async () => {
    const error = () =>
      createMessage({
        type: 'validation',
        key: 'required_rule',
        blocking: true,
      })
    const tree = createShippingTree()
    tree.at('form')!.store.set(error())
    tree.at('form.address')!.store.set(error())
    tree.at('form.address.state')!.store.set(error())
    tree.at('form.products.1.price')!.store.set(error())
    tree.ledger.count('blocking', (m) => m.blocking)
    expect(tree.ledger.value('blocking')).toBe(4)
    const isSettled = jest.fn()
    tree.ledger.settled('blocking').then(isSettled)
    tree.store.remove('required_rule')
    await nextTick()
    expect(isSettled).toHaveBeenCalledTimes(0)
    tree.at('form.address')!.store.remove('required_rule')
    tree.at('form.address.state')!.store.remove('required_rule')
    expect(tree.ledger.value('blocking')).toBe(1)
    tree.at('form.products.1.price')!.store.remove('required_rule')
    await nextTick()
    expect(isSettled).toHaveBeenCalledTimes(1)
  })

  it('counts subtree values', () => {
    const error = () =>
      createMessage({
        type: 'validation',
        key: 'required_rule',
        blocking: true,
      })
    const tree = createShippingTree()
    tree.ledger.count('blocking', (m) => m.blocking)
    tree.at('form')!.store.set(error())
    tree.at('form.address')!.store.set(error())
    tree.at('form.address.state')!.store.set(error())
    expect(tree.at('form.address')!.ledger.value('blocking')).toBe(2)
  })

  it('emits an unsettled event when counting', () => {
    const error = () =>
      createMessage({
        type: 'validation',
        key: 'required_rule',
        blocking: true,
      })
    const tree = createShippingTree()
    tree.ledger.count('blocking', (m) => m.blocking)
    const listener = jest.fn()
    tree.on('unsettled:blocking', listener)
    tree.at('form.address.state')!.store.set(error())
    tree.at('form.address.city')!.store.set(error())
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('emits a settled event when settling', async () => {
    const error = () =>
      createMessage({
        type: 'validation',
        key: 'required_rule',
        blocking: true,
      })
    const tree = createShippingTree()
    const settledListener = jest.fn()
    tree.on('settled:blocking', settledListener)
    tree.ledger.count('blocking', (m) => m.blocking)
    tree.at('form')!.store.set(error())
    tree.at('form.address')!.store.set(error())
    expect(settledListener).toHaveBeenCalledTimes(0)
    tree.store.remove('required_rule')
    expect(settledListener).toHaveBeenCalledTimes(0)
    tree.at('form.address')!.store.remove('required_rule')
    await nextTick()
    expect(settledListener).toHaveBeenCalledTimes(1)
  })

  it('adds to store counts from new children', () => {
    const node = createNode({
      type: 'group',
    })
    const error = () =>
      createMessage({
        type: 'validation',
        key: 'required_rule',
        blocking: true,
      })
    node.ledger.count('blocking', (m) => m.blocking)
    node.store.set(error())
    expect(node.ledger.value('blocking')).toBe(1)
    const subtree = createNode({
      type: 'group',
      children: [createNode({ name: 'username' })],
    })
    subtree.store.set(error())
    subtree.at('username')!.store.set(error())
    node.add(subtree)
    expect(node.ledger.value('blocking')).toBe(3)
  })

  it('removes from store counts for removed children', () => {
    const node = createNode({
      type: 'group',
      children: [createNode({ name: 'username' })],
    })
    const error = () =>
      createMessage({
        type: 'validation',
        key: 'required_rule',
        blocking: true,
      })
    node.ledger.count('blocking', (m) => m.blocking)
    node.at('username')!.store.set(error())
    expect(node.ledger.value('blocking')).toBe(1)
    node.remove(node.at('username')!)
    expect(node.ledger.value('blocking')).toBe(0)
  })

  it('can deeply add and remove subtree ledger counts', () => {
    const error = () =>
      createMessage({
        type: 'validation',
        key: 'required_rule',
        blocking: true,
      })
    const tree = createShippingTree()
    tree.at('form')!.store.set(error())
    tree.at('form.address')!.store.set(error())
    tree.at('form.address.state')!.store.set(error())
    tree.at('form.products.1.price')!.store.set(error())
    tree.ledger.count('blocking', (m) => m.blocking)
    expect(tree.ledger.value('blocking')).toBe(4)
    const address = tree.at('address')!
    tree.remove(address)
    expect(tree.ledger.value('blocking')).toBe(2)
    expect(address.ledger.value('blocking')).toBe(2)
    const subNode = createNode({ name: 'street2' })
    subNode.store.set(
      createMessage({
        type: 'help',
        value: 'hello world',
      })
    )
    subNode.store.set(error())
    address.add(subNode)
    tree.add(address)
    expect(tree.ledger.value('blocking')).toBe(5)
  })

  it('a plugin can emit a counted message to a parent before complete registration', () => {
    const parent = createNode({
      type: 'group',
    })
    parent.ledger.count('blocking', (m) => m.blocking)
    createNode({
      parent,
      plugins: [(node) => node.store.set(createMessage({ blocking: true }))],
    })
    expect(parent.ledger.value('blocking')).toBe(1)
  })

  it('reduces the ledger count when a subtree is removed', () => {
    const child1 = token()
    const child2 = token()

    const node = createNode({
      type: 'group',
      children: [
        createNode({
          type: 'group',
          props: { id: 'firstGroup' },
          children: [
            createNode({ type: 'input', props: { id: child1 } }),
            createNode({ type: 'input', props: { id: child2 } }),
          ],
        }),
      ],
    })

    node.ledger.count('blocking', (m) => m.blocking)

    getNode(child1)!.store.set(createMessage({ blocking: true }))
    getNode(child2)!.store.set(createMessage({ blocking: true }))
    expect(node.ledger.value('blocking')).toBe(2)
    getNode('firstGroup')?.destroy()
    expect(node.ledger.value('blocking')).toBe(0)
  })
})
