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
    const hasValidationMessages = Object.values(n.store).some(
      (message) => message.type === 'validation'
    )
    for (const key in n.store) {
      const message = n.store[key]
      if (
        message.type === 'error' ||
        (message.type === 'ui' && key === 'incomplete')
      ) {
        n.store.remove(key)
      } else if (message.type === 'state') {
        n.store.set({
          ...message,
          value: key === 'failing' ? hasValidationMessages : false,
        })
      }
    }
  }
  clear(node)
  node.walk(clear)
}

const missingResetValue = Symbol('missingResetValue')

function valueAtResetAddress(
  value: unknown,
  address: Array<string | number>
): unknown | typeof missingResetValue {
  let current = value
  for (const segment of address) {
    if (
      current === null ||
      typeof current !== 'object' ||
      !(segment in current)
    ) {
      return missingResetValue
    }
    current = (current as Record<string | number, unknown>)[segment]
  }
  return current
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
    const initial = (n: FormKitNode) => {
      const initial = cloneAny(n.props.initial)

      if (initial !== undefined) return initial

      return n.type === 'group' ? {} : n.type === 'list' ? [] : undefined
    }

    // pause all events in this tree.
    node._e.pause(node)
    // Set it back to basics
    const resetValue = cloneAny(resetTo)
    const hasExplicitReset = Boolean(resetTo && !empty(resetTo))
    const isDeepReset =
      hasExplicitReset && node.type !== 'input' && isObject(resetTo)
    if (hasExplicitReset) {
      node.props.initial = isObject(resetValue) ? init(resetValue) : resetValue
      node.props._init = node.props.initial
    }
    if (isDeepReset) {
      node.walk((child) => {
        const resetAddress = child.address.slice(node.address.length)
        const childResetValue = valueAtResetAddress(resetValue, resetAddress)
        const nextInitial =
          childResetValue === missingResetValue
            ? initial(child)
            : cloneAny(childResetValue)
        child.props.initial = isObject(nextInitial)
          ? init(nextInitial)
          : nextInitial
        child.props._init = child.props.initial
      })
    }

    // Set children back to basics in case they were additive (had their own value for example)
    node.walk((child) => {
      // Skip resetting synced lists to default.
      if (child.type === 'list' && child.sync) return
      child.input(initial(child), false)
    })
    // Finally we need to lay any values back on top (if it is a group/list) since group values
    // take precedence over child values.
    node.input(
      empty(resetValue) && resetValue ? resetValue : initial(node),
      false
    )

    // If this is a deep reset, we need to make sure the "initial" state of all
    // children are also reset. Fixes https://github.com/formkit/formkit/issues/791#issuecomment-1651213253
    if (isDeepReset) {
      node.walk((child) => {
        // Clone the value so deep comparisons (e.g., dirty checks) work correctly.
        // A true immutable snapshot is captured for the child's initial state.
        const clonedValue = cloneAny(child.value)
        child.props.initial = isObject(clonedValue)
          ? init(clonedValue)
          : clonedValue
        child.props._init = child.props.initial
      })
    }
    // release the events.
    node._e.play(node)
    clearState(node)
    node.emit('reset', node)
    node.walk((child) => child.emit('reset', child))
    return node
  }
  warn(152, id)
  return
}
