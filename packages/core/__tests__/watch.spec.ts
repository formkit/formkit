import { createNode } from '../src'
import { jest } from '@jest/globals'
import { FormKitWatchable, killWatch, watch } from '../src/watch'

describe('node dependency watching', () => {
  it('can watch a node accessing its child', async () => {
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
    watch(node, watcher, ['commit'])
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
    const success = jest.fn()
    const watcher: FormKitWatchable = jest.fn((node) => {
      if (node.at('$root')?.props.whale) {
        success()
      }
    })
    watch(child, watcher, ['prop'])
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledTimes(0)
    parent.props.whale = true
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
          children: [child],
        }),
      ],
    })
    const success = jest.fn()
    const watcher: FormKitWatchable = jest.fn((node) => {
      if (node.at('$root')?.props.whale) {
        success(node.parent)
      }
    })
    watch(child, watcher, ['prop'])
    expect(watcher).toHaveBeenCalledTimes(1)
    parent.at('user')!.props.label = 'hello'
    expect(watcher).toHaveBeenCalledTimes(2)
    parent.props.whale = false
    expect(watcher).toHaveBeenCalledTimes(3)
    parent.at('user')!.props.label = 'world'
    expect(watcher).toHaveBeenCalledTimes(3)
  })

  it('can de-register all watchers with killWatch', async () => {
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
    const receipt = watch(node, watcher, ['commit'])
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledTimes(0)
    killWatch(receipt)
    await child.input('bar')
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledTimes(0)
  })
})
