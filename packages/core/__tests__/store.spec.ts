import createNode from '../src/node'
import { createMessage } from '../src/store'

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
    node.on('message', listener)
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
    node.on('message', listener)
    node.at('buildings.wall.0')?.store.set(message)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0].payload).toBe(message)
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
    expect(listener.mock.calls[0][0].payload).toBe(message)
  })
})
