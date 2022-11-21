import { createNode, createMessage } from '@formkit/core'
import type { FormKitWatchable} from '../src';
import { createObserver, isKilled } from '../src'
import { jest } from '@jest/globals'

describe('observer', () => {
  it('can detect requests for value on primary node', () => {
    const node = createNode({ value: 123 })
    const obs = createObserver(node)
    obs.observe()
    obs.value
    const deps = obs.stopObserve()
    expect(deps.get(node)).toEqual(new Set(['commit']))
  })

  it('does not detect value when touching other data', () => {
    const node = createNode({ value: 123 })
    const obs = createObserver(node)
    obs.observe()
    obs.config.delay
    const deps = obs.stopObserve()
    expect(deps.get(node)?.has('commit')).toBeFalsy()
  })

  it('can watch a block for dependencies and then re-call that code', () => {
    const node = createObserver(
      createNode({ value: 120, config: { label: 'hi', altLabel: 'bye' } })
    )
    const validation: FormKitWatchable = jest.fn((node) => {
      if ((node.value as number) > 123) {
        return node.config.label
      }
      return node.config.altLabel
    })
    node.watch(validation)
    expect(validation).toHaveBeenCalledTimes(1)
    node.input(400, false)
    expect(validation).toHaveBeenCalledTimes(2)
  })

  it('can watch a node accessing its child', async () => {
    const child = createNode({ name: 'username', value: 'foo' })
    const node = createNode({
      type: 'group',
      children: [child],
    })
    const obs = createObserver(node)
    const success = jest.fn()
    const watcher: FormKitWatchable = jest.fn((node) => {
      if (node.at('username')?.value === 'bar') {
        success()
      }
    })
    obs.watch(watcher)
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledTimes(0)
    await child.input('bar')
    expect(watcher).toHaveBeenCalledTimes(2)
    expect(success).toHaveBeenCalledTimes(1)
  })

  it('watches parents of nested inputs inside the watcher', async () => {
    // This method of traversal is not recommended but possible.
    const child = createNode({ name: 'username', value: 'bar' })
    const parent = createNode({
      type: 'group',
      children: [
        createNode({
          name: 'user',
          type: 'group',
          children: [child],
        }),
      ],
    })
    const obs = createObserver(parent)
    const success = jest.fn()
    const watcher: FormKitWatchable = jest.fn((node) => {
      if (node.at('$root')?.props.whale) {
        success()
      }
    })
    obs.watch(watcher)
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledTimes(0)
    parent.props.whale = true
    parent.props.foobar = false // does not trigger because it is not used in the watcher
    expect(watcher).toHaveBeenCalledTimes(2)
    expect(success).toHaveBeenCalledTimes(1)
  })

  it('removes event listeners from nodes in a "logic shadow"', async () => {
    const child = createNode({ name: 'username', value: 'bar' })
    const parent = createNode({
      type: 'group',
      props: {
        whale: true,
      },
      children: [
        createNode({
          name: 'user',
          type: 'group',
          props: {
            goose: false,
          },
          children: [child],
        }),
      ],
    })
    const childObserver = createObserver(child)
    const success = jest.fn()
    const watcher: FormKitWatchable = jest.fn((child) => {
      if (child.at('$root')?.props.whale) {
        success(child.parent?.props.goose)
      }
    })
    childObserver.watch(watcher)
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenNthCalledWith(1, false)
    parent.props.whale = false
    expect(watcher).toHaveBeenCalledTimes(2)
    expect(success).toHaveBeenNthCalledWith(1, false)
    parent.at('user')!.props.goose = true
    expect(watcher).toHaveBeenCalledTimes(2)
  })

  it('can de-register all watchers with the kill command', async () => {
    const child = createNode({ name: 'username', value: 'foo' })
    const node = createNode({
      type: 'group',
      children: [child],
    })
    const success = jest.fn()
    const watcher: FormKitWatchable = jest.fn((node) => {
      if (node.at('username')?.value === 'bar') {
        success()
      }
    })
    const obs = createObserver(node)
    obs.watch(watcher)
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledTimes(0)
    obs.kill()
    await child.input('bar')
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledTimes(0)
    expect(() => obs.value).toThrow(TypeError)
  })

  it('tracks when an observer has been destroyed', () => {
    const node = createNode()
    const observer = createObserver(node)
    const observer2 = createObserver(node)
    observer.kill()
    expect(isKilled(observer)).toBe(true)
    expect(isKilled(observer2)).toBe(false)
  })

  it('can observe a ledger count', () => {
    const child = createNode({ name: 'username', value: 'foo' })
    const node = createNode({
      type: 'group',
      children: [child],
    })
    node.ledger.count('blocking', (message) => message.blocking)
    const watcher: FormKitWatchable = jest.fn((node) => {
      return node.ledger.value('blocking')
    })
    const obs = createObserver(node)
    obs.watch(watcher)
    expect(watcher).toHaveBeenCalledTimes(1)
    node.store.set(createMessage({ blocking: true }))
    expect(watcher).toHaveBeenCalledTimes(2)
    expect(watcher).toHaveReturnedWith(1)
  })
})
