import { createNode } from '../src/node'
import { FormKitEvent } from '../src/events'
import { createMessage } from '../src/store'
import { jest } from '@jest/globals'

describe('setting store messages', () => {
  it('can set a message', () => {
    const node = createNode()
    node.store.set(
      createMessage({
        key: 'pizza',
        value: 'party',
      })
    )
    expect(node.store.pizza).toEqual({
      key: 'pizza',
      value: 'party',
      blocking: false,
      meta: {},
      type: 'state',
      visible: true,
    })
  })

  it('throws an error (E2) when directly modifying the store', () => {
    const node = createNode()
    node.store.set(createMessage({ key: 'abc' }))
    expect(() => {
      node.store.party = createMessage({})
    }).toThrow('E2')
  })

  it('allows overwriting store messages', () => {
    const node = createNode()
    node.store.set(createMessage({ key: 'robot', value: 'beep' }))
    expect(node.store.robot.value).toBe('beep')
    node.store.set(createMessage({ key: 'robot', value: 'boop' }))
    expect(node.store.robot.value).toBe('boop')
  })

  it('does not emit an event if the same message is already set', () => {
    const node = createNode()
    const listener = jest.fn()
    node.on('message-added', listener)
    node.on('message-updated', listener)
    const message = createMessage({ key: 'robot', value: 'beep' })
    node.store.set(message)
    expect(listener).toHaveBeenCalledTimes(1)
    node.store.set(message)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('bubbles message events', () => {
    const node = createNode({
      type: 'group',
      name: 'buildings',
      children: [
        createNode({
          type: 'list',
          name: 'wall',
          children: [createNode({ name: 'brick' })],
        }),
      ],
    })
    const message = createMessage({
      key: 'mortar',
    })
    const listener = jest.fn()
    node.on('message-added.deep', listener)
    node.at('buildings.wall.0')?.store.set(message)
    expect(listener).toHaveBeenCalledTimes(1)
    expect((listener.mock.calls[0][0] as FormKitEvent).payload).toBe(message)
  })

  it('emits message-updated for changed messages', () => {
    const node = createNode()
    const addedListener = jest.fn()
    const updatedListener = jest.fn()
    node.on('message-added', addedListener)
    node.on('message-updated', updatedListener)
    const message = createMessage({ key: 'robot', value: 'beep' })
    node.store.set(message)
    expect(addedListener).toHaveBeenCalledTimes(1)
    node.store.set(message)
    expect(updatedListener).toHaveBeenCalledTimes(0)
    const message2 = createMessage({ key: 'robot', value: 'boop' })
    node.store.set(message2)
    expect(addedListener).toHaveBeenCalledTimes(1)
    expect(updatedListener).toHaveBeenCalledTimes(1)
  })
})

describe('removing store messages', () => {
  it('removes existing keys', () => {
    const node = createNode()
    node.store.set(createMessage({ key: 'sky', value: 'cloud' }))
    node.store.remove('sky')
    expect(Object.keys(node.store).length).toBe(0)
  })

  it('emits a message-removed event existing keys', () => {
    const node = createNode()
    const listener = jest.fn()
    node.on('message-removed', listener)
    const message = createMessage({ key: 'sky', value: 'cloud' })
    node.store.set(message)
    node.store.remove('sky')
    expect(listener).toHaveBeenCalledTimes(1)
    expect((listener.mock.calls[0][0] as FormKitEvent).payload).toBe(message)
  })

  it('can filter out store messages', () => {
    const node = createNode()
    node.store.set(createMessage({ key: 'chocolate', type: 'foo' }))
    node.store.set(createMessage({ key: 'apple', type: 'bar' }))
    node.store.set(createMessage({ key: 'vanilla', type: 'bar' }))
    node.store.filter((message) => message.key === 'apple')
    expect(Object.keys(node.store)).toEqual(['apple'])
  })

  it('can filter out store messages by type', () => {
    const node = createNode()
    node.store.set(createMessage({ key: 'chocolate', type: 'foo' }))
    node.store.set(createMessage({ key: 'apple', type: 'bar' }))
    node.store.set(createMessage({ key: 'vanilla', type: 'bar' }))
    const filter = jest.fn(() => false)
    node.store.filter(filter, 'bar')
    expect(Object.keys(node.store)).toEqual(['chocolate'])
  })

  it('can change the value of a message using t()', () => {
    const node = createNode()
    node.hook.text((frag, next) => {
      frag.value = 'casa'
      return next(frag)
    })
    node.store.set(
      createMessage({ key: 'foo', type: 'foo', value: 'house' }, node)
    )
    expect(node.store.foo.value).toBe('casa')
  })

  it('can prevent localizing the value of a message by setting meta.localize to false', () => {
    const node = createNode()
    node.hook.text((frag, next) => {
      frag.value = 'casa'
      return next(frag)
    })
    node.store.set(
      createMessage({
        key: 'foo',
        type: 'foo',
        value: 'house',
        meta: { localize: false },
      })
    )
    expect(node.store.foo.value).toBe('house')
  })

  it('can buffer messages', () => {
    const listener = jest.fn()
    const node = createNode()
    node.on('message-added', listener)
    node.store.buffer = true
    node.store.set(createMessage({ key: 'foo' }))
    node.store.set(createMessage({ key: 'abc' }))
    expect(listener).toHaveBeenCalledTimes(0)
    expect(node.store).not.toHaveProperty('foo')
    expect(node.store).not.toHaveProperty('abc')
    node.store.release()
    expect(listener).toHaveBeenCalledTimes(2)
    expect(node.store).toHaveProperty('foo')
    expect(node.store).toHaveProperty('abc')
  })

  it('can remove a buffered message', () => {
    const addedListener = jest.fn()
    const removedListener = jest.fn()
    const node = createNode()
    node.on('message-added', addedListener)
    node.on('message-removed', removedListener)
    node.store.buffer = true
    node.store.set(createMessage({ key: 'foo' }))
    node.store.remove('foo')
    node.store.release()
    expect(addedListener).toHaveBeenCalledTimes(0)
    expect(removedListener).toHaveBeenCalledTimes(0)
    expect(node.store).not.toHaveProperty('foo')
  })

  it('can apply messages to a node and clear with type', () => {
    const node = createNode()
    node.store.set(
      createMessage({
        type: 'bar',
        key: 'd',
      })
    )
    const messageA = createMessage({ type: 'foo', key: 'a' })
    const messageB = createMessage({ type: 'foo', key: 'b' })
    const messageC = createMessage({ type: 'foo', key: 'c' })
    node.store.apply([messageA, messageB, messageC])
    expect(Object.keys(node.store)).toStrictEqual(['d', 'a', 'b', 'c'])
    node.store.apply([messageA, messageC], 'foo')
    expect(Object.keys(node.store)).toStrictEqual(['d', 'a', 'c'])
  })

  it('can apply messages to a node and clear with function', () => {
    const node = createNode()
    node.store.set(
      createMessage({
        type: 'bar',
        key: 'd',
      })
    )
    const messageA = createMessage({ type: 'foo', key: 'a' })
    const messageB = createMessage({ type: 'foo', key: 'b' })
    const messageC = createMessage({ type: 'foo', key: 'c' })
    node.store.apply([messageA, messageB, messageC])
    expect(Object.keys(node.store)).toStrictEqual(['d', 'a', 'b', 'c'])
    node.store.apply([], (message) => message.key > 'b')
    expect(Object.keys(node.store)).toStrictEqual(['d', 'c'])
  })

  it('can apply messages to its children', () => {
    const group = createNode({
      type: 'group',
      children: [createNode({ name: 'kris' }), createNode({ name: 'kringle' })],
    })
    group.store.apply(
      {
        kris: [createMessage({ type: 'foo', key: 'a' })],
        kringle: [
          createMessage({ type: 'foo', key: 'b' }),
          createMessage({ type: 'bar', key: 'c' }),
        ],
      },
      'foo'
    )
    expect(Object.keys(group.at('kris')!.store)).toEqual(['a'])
    expect(Object.keys(group.at('kringle')!.store)).toEqual(['b', 'c'])
    group.store.apply({ kris: [], kringle: [] }, 'foo')
    expect(Object.keys(group.at('kris')!.store)).toEqual([])
    expect(Object.keys(group.at('kringle')!.store)).toEqual(['c'])
  })
})
