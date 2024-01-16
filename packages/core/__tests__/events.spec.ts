import { createNode } from '../src/node'
import { createShippingTree } from '../../../.tests/helpers'
import { describe, expect, it, vi } from 'vitest'
import { FormKitEvent } from '../src/events'

describe('emitting and listening to events', () => {
  it('can emit an arbitrary event', () => {
    const name = createNode()
    const listener = vi.fn()
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
    const listener = vi.fn()
    const listener2 = vi.fn()
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
    const listener = vi.fn()
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
    const listener = vi.fn()
    tree.on('input.deep', listener)
    const bubblePreventer = vi.fn((e: FormKitEvent) => {
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
    const listener = vi.fn()
    const receipt = node.on('dothings', listener)
    node.emit('dothings')
    expect(listener).toHaveBeenCalledTimes(1)
    node.off(receipt)
    node.emit('dothings')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('can add an event listener with it’s own receipt to multiple events', () => {
    const listener = vi.fn()
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
    const topListener = vi.fn()
    const innerListener = vi.fn()
    tree.on('prop:label', topListener)
    tree.at('name')!.on('prop:label', innerListener)
    tree.at('name')!.props.label = 'hello world'
    expect(topListener).toHaveBeenCalledTimes(0)
    expect(innerListener).toHaveBeenCalledTimes(1)
  })

  it('can pause events', () => {
    const node = createNode()
    const foo = vi.fn()
    const bar = vi.fn()
    node.on('foo', foo)
    node.on('bar', bar)
    node._e.pause()
    node.emit('foo', 123)
    node.emit('bar', 456)
    node.emit('foo', 223)
    expect(foo).not.toHaveBeenCalled()
    expect(bar).not.toHaveBeenCalled()
    node._e.play()
    expect(foo).toHaveBeenCalledTimes(1)
    expect(bar).toHaveBeenCalledTimes(1)
    expect(foo).toHaveBeenCalledWith(expect.objectContaining({ payload: 223 }))
  })

  it('can emit an event with custom meta', () => {
    const node = createNode()
    const listener = vi.fn()
    node.on('foo', listener)
    node.emit('foo', 123, false, { here: 'there' })
    expect(listener).toHaveBeenCalledWith({
      payload: 123,
      name: 'foo',
      bubble: false,
      origin: node,
      meta: { here: 'there' },
    })
  })

  it('can add an event listener before another even when defined later', () => {
    const node = createNode()
    const callStack: string[] = []
    const a = () => callStack.push('a')
    const b = () => callStack.push('b')
    const c = () => callStack.push('c')
    node.on('commit', a)
    node.on('commit', b)
    node.on('commit', c, 'unshift')
    node.input('fizz', false)
    expect(callStack).toEqual(['c', 'a', 'b'])
  })
})
