import { createTicketTree } from '../../../.jest/helpers'
import { createNode } from '../src/node'
import { createMessage } from '../src/store'
import { jest } from '@jest/globals'

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
})
