import { createNode, createMessage } from '@formkit/core'
import {
  createObserver,
  FormKitWatchable,
  isKilled,
  FormKitObservedNode,
} from '../src'
import { describe, expect, it, vi } from 'vitest'

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
    const validation: FormKitWatchable = vi.fn((node) => {
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

  it('can watch a block and then pass the result to an after function that does not track', () => {
    const node = createObserver(
      createNode({ value: 1, props: { multiplier: 3, equals: 9 } })
    )
    const watchable = vi.fn(
      (node: FormKitObservedNode) =>
        node.props.multiplier * (node.value as number)
    )
    const after = vi.fn((value: number) => node.props.equals === value)
    node.watch(watchable, after)
    expect(watchable).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenLastCalledWith(3)
    node.input(2, false)
    expect(watchable).toHaveBeenCalledTimes(2)
    expect(after).toHaveBeenCalledTimes(2)
    expect(after).toHaveBeenLastCalledWith(6)
    node.props.equals = 12
    expect(watchable).toHaveBeenCalledTimes(2)
    expect(after).toHaveBeenCalledTimes(2)
  })

  it('does not call an observer if the value has not changed', () => {
    const node = createNode({ name: 'username', value: 'foo' })
    const observed = createObserver(node)
    const callback = vi.fn((n: FormKitObservedNode) => {
      if (n.value === 'bar') {
        // do things
      }
    })
    observed.watch(callback)
    expect(callback).toHaveBeenCalledTimes(1)
    node.input('foo', false)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('can watch a node accessing its child', async () => {
    const child = createNode({ name: 'username', value: 'foo' })
    const node = createNode({
      type: 'group',
      children: [child],
    })
    const obs = createObserver(node)
    const success = vi.fn()
    const watcher: FormKitWatchable = vi.fn((node) => {
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
    const success = vi.fn()
    const watcher: FormKitWatchable = vi.fn((node) => {
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
    const success = vi.fn()
    const watcher: FormKitWatchable = vi.fn((child) => {
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
    const success = vi.fn()
    const watcher: FormKitWatchable = vi.fn((node) => {
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
    const watcher: FormKitWatchable = vi.fn((node) => {
      return node.ledger.value('blocking')
    })
    const obs = createObserver(node)
    obs.watch(watcher)
    expect(watcher).toHaveBeenCalledTimes(1)
    node.store.set(createMessage({ blocking: true }))
    expect(watcher).toHaveBeenCalledTimes(2)
    expect(watcher).toHaveReturnedWith(1)
  })

  it('stops watching when killed', () => {
    const node = createNode()
    const observed = createObserver(node)
    const watcher = vi.fn((node: FormKitObservedNode) => node.value)
    observed.watch(watcher)
    expect(watcher).toHaveBeenCalledTimes(1)
    observed.kill()
    node.input('fizbuz')
    expect(watcher).toHaveBeenCalledTimes(1)
  })

  it('can watch children of a group', () => {
    const parent = createNode({ type: 'group' })
    const observed = createObserver(parent)
    const watcher = vi.fn((node: FormKitObservedNode) => node.children.length)
    observed.watch(watcher)
    expect(watcher).toHaveNthReturnedWith(1, 0)
    const child = createNode()
    parent.add(child)
    expect(watcher).toHaveNthReturnedWith(2, 1)
    parent.remove(child)
    expect(watcher).toHaveNthReturnedWith(3, 0)
  })

  it('can add itself to the front of the event stack', () => {
    const node = createNode()
    const observed = createObserver(node)
    const stack: string[] = []
    node.on('commit', () => stack.push('a'))
    observed.watch(
      (n) => {
        if (typeof n.value === 'string') {
          stack.push('b')
        }
      },
      undefined,
      'unshift'
    )

    node.input('foo', false)
    expect(stack).toEqual(['b', 'a'])
  })
})
