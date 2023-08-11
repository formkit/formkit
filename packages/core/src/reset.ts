import { cloneAny, init, isObject, empty } from '@formkit/utils'
import { FormKitNode } from './node'
import { warn } from './errors'
import { getNode } from './registry'

/**
 * Clear all state and error messages.
 *
 * @internal
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
 * Resets an input to its "initial" value. If the input is a group or list it
 * resets all the children as well.
 *
 * @param id - The id of an input to reset.
 * @param resetTo - A value to reset the node to.
 *
 * @returns A {@link FormKitNode | FormKitNode} or `undefined`.
 *
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
    const resetValue = cloneAny(resetTo)
    if (resetTo && !empty(resetTo)) {
      node.props.initial = isObject(resetValue) ? init(resetValue) : resetValue
      node.props._init = node.props.initial
    }
    node.input(initial(node), false)

    // Set children back to basics in case they were additive (had their own value for example)
    node.walk((child) => child.input(initial(child), false))
    // Finally we need to lay any values back on top (if it is a group/list) since group values
    // take precedence over child values.
    node.input(
      empty(resetValue) && resetValue ? resetValue : initial(node),
      false
    )

    // If this is a deep reset, we need to make sure the "initial" state of all
    // children are also reset. Fixes https://github.com/formkit/formkit/issues/791#issuecomment-1651213253
    const isDeepReset =
      node.type !== 'input' && resetTo && !empty(resetTo) && isObject(resetTo)
    if (isDeepReset) {
      node.walk((child) => {
        child.props.initial = isObject(child.value)
          ? init(child.value)
          : child.value
        child.props._init = node.props.initial
      })
    }
    // release the events.
    node._e.play(node)
    clearState(node)
    node.emit('reset', node)
    return node
  }
  warn(152, id)
  return
}
