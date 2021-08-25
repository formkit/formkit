import { createNode } from '@formkit/core'
import { createObserver, FormKitWatchable } from '../src'
import { jest } from '@jest/globals'
import {} from 'packages/core/src'

const nextTick = () => new Promise<void>((r) => setTimeout(r, 0))

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
      if (node.value > 123) {
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

  it('can observe a node during an async operation', async () => {
    const childA = createNode({ name: 'username', value: 'foo' })
    const childB = createNode({ name: 'password', value: 'foo' })
    const childC = createNode({ name: 'name', value: 'foo' })
    createNode({
      type: 'group',
      children: [childA, childB, childC],
    })
    const obs = createObserver(childA)
    const watcher: FormKitWatchable = jest.fn((node) => {
      return new Promise((r) => {
        setTimeout(() => {
          if (node.at('password')?.value === 'foobar') {
            r(true)
          } else {
            r(false)
          }
        }, 100)
      })
    })
    obs.watch(watcher)
    childA.at('name')?.value // just touch the name input while the promise is resolving
    await new Promise((r) => setTimeout(r, 120))
    expect(watcher).toHaveBeenCalledTimes(1)
    childC.input('hello', false)
    await nextTick()
    // Should not affect our watcher
    expect(watcher).toHaveBeenCalledTimes(1)
    childB.input('hi', false)
    await nextTick()
    expect(watcher).toHaveBeenCalledTimes(2)
  })
})
