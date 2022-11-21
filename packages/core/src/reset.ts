import { cloneAny, init } from '@formkit/utils'
import type { FormKitNode } from './node'
import { warn } from './errors'
import { getNode } from './registry'

/**
 * Clear all state and error messages.
 */
function clearState(node: FormKitNode) {
  const clear = (n: FormKitNode) => {
    for (const key in n.store) {
      const message = n.store[key]
      if (
        message.type === 'error' ||
        (message.type === 'ui' && key === 'incomplete')
      ) {
        n.store.remove(key)
      } else if (message.type === 'state') {
        n.store.set({ ...message, value: false })
      }
    }
  }
  clear(node)
  node.walk(clear)
}

/**
 * Resets an input to it’s "initial" value — if the input is a group or list it
 * resets all the children as well.
 * @param id - The id of an input to reset
 * @returns
 * @public
 */
export function reset(
  id: string | FormKitNode,
  resetTo?: unknown
): FormKitNode | undefined {
  const node = typeof id === 'string' ? getNode(id) : id
  if (node) {
    const initial = (n: FormKitNode) =>
      cloneAny(n.props.initial) ||
      (n.type === 'group' ? {} : n.type === 'list' ? [] : undefined)

    // pause all events in this tree.
    node._e.pause(node)
    // Set it back to basics
    node.input(cloneAny(resetTo) || initial(node), false)
    // Set children back to basics in case they were additive (had their own value for example)
    node.walk((child) => child.input(initial(child), false))
    // Finally we need to lay any values back on top (if it is a group/list) since group values
    // take precedence over child values.
    const finalInit = initial(node)
    node.input(
      typeof finalInit === 'object'
        ? cloneAny(resetTo) || init(finalInit)
        : finalInit,
      false
    )
    // release the events.
    node._e.play(node)
    clearState(node)
    node.emit('reset', node)
    return node
  }
  warn(152, id)
  return
}
