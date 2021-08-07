import { createNode } from '../src/node'
import { createShippingTree } from '../../../.jest/helpers'
import { jest } from '@jest/globals'
import { FormKitEvent } from '../src/events'

describe('emitting and listening to events', () => {
  it('can emit an arbitrary event', () => {
    const name = createNode()
    const listener = jest.fn()
    name.on('blur', listener)
    name.emit('blur', 'hello')
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

  it('can listen to deep events in the tree', () => {
    const tree = createShippingTree()
    const listener = jest.fn()
    tree.on('input.deep', listener)
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
    tree.on('input.deep', listener)
    const bubblePreventer = jest.fn((e: FormKitEvent) => {
      e.bubble = false
    })
    tree.at('form.products.0')!.on('input.deep', bubblePreventer)
    const product = tree.at('form.products.0.product')!
    product.input('Sweater')
    expect(bubblePreventer).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledTimes(0)
  })

  it('can remove an event listener by the receipt', () => {
    const node = createNode()
    const listener = jest.fn()
    const receipt = node.on('dothings', listener)
    node.emit('dothings')
    expect(listener).toHaveBeenCalledTimes(1)
    node.off(receipt)
    node.emit('dothings')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('can add an event listener with it’s own receipt to multiple events', () => {
    const listener = jest.fn()
    const greeting = () => listener()
    greeting.receipt = 'foobar'
    const node = createNode()
    node.on('hello', greeting)
    node.on('goodbye', greeting)
    node.emit('hello')
    node.emit('goodbye')
    expect(listener).toHaveBeenCalledTimes(2)
    node.off('foobar')
    node.emit('hello')
    node.emit('goodbye')
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('emits a non-bubbling prop event for the compound prop and prop name', () => {
    const tree = createShippingTree()
    const topListener = jest.fn()
    const innerListener = jest.fn()
    tree.on('prop:label', topListener)
    tree.at('name')!.on('prop:label', innerListener)
    tree.at('name')!.props.label = 'hello world'
    expect(topListener).toHaveBeenCalledTimes(0)
    expect(innerListener).toHaveBeenCalledTimes(1)
  })
})
