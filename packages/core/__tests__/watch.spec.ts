import { createNode } from '../src'
import { jest } from '@jest/globals'
import { FormKitWatchable } from '../src/watch'

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
    node.watch(watcher, ['commit'])
    expect(watcher).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledTimes(0)
    await child.input('bar')
    expect(watcher).toHaveBeenCalledTimes(2)
    expect(success).toHaveBeenCalledTimes(1)
  })
})
