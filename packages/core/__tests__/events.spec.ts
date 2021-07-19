import { createNode } from '../src/node'
import { createShippingTree } from '../../../.jest/helpers'
import { jest } from '@jest/globals'
import { FormKitEvent } from '../src/events'

describe('emitting and listening to events', () => {
  it('can emit an arbitrary event', () => {
    const name = createNode()
    const listener = jest.fn()
    name.on('blur', listener).emit('blur', 'hello')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({
      name: 'blur',
      payload: 'hello',
      bubble: true,
      origin: name,
    })
  })

  it('emits multiple input events for each submit', async () => {
    const node = createNode({ value: 123 })
    const listener = jest.fn()
    const listener2 = jest.fn()
    node.on('input', listener)
    node.on('commit', listener2)
    node.input(456)
    node.input(789)
    expect(listener).toHaveBeenCalledTimes(2)
    await node.settled
    expect(listener2).toHaveBeenCalledTimes(1)
  })

  it('bubbles input events up a node tree', () => {
    const tree = createShippingTree()
    const listener = jest.fn()
    tree.on('input', listener)
    const product = tree.at('form.products.0.product')!
    product.input('Sweater')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({
      name: 'input',
      bubble: true,
      origin: product,
      payload: 'Sweater',
    })
  })

  it('can prevent propagation', () => {
    const tree = createShippingTree()
    const listener = jest.fn()
    tree.on('input', listener)
    const bubblePreventer = jest.fn((e: FormKitEvent) => {
      e.bubble = false
    })
    tree.at('form.products.0')!.on('input', bubblePreventer)
    const product = tree.at('form.products.0.product')!
    product.input('Sweater')
    expect(bubblePreventer).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledTimes(0)
  })
})
