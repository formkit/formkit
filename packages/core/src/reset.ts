import { cloneAny, init } from '@formkit/utils'
import { FormKitNode } from './node'
import { warn } from './errors'
import { getNode } from './registry'

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
      cloneAny(resetTo || n.props.initial) ||
      (n.type === 'group' ? {} : n.type === 'list' ? [] : undefined)
    // pause all events in this tree.
    node._e.pause(node)
    // Set it back to basics
    node.input(initial(node), false)
    // Set children back to basics in case they were additive (had their own value for example)
    node.walk((child) => child.input(initial(child), false))
    // Finally we need to lay any values back on top (if it is a group/list) since group values
    // take precedence over child values.
    const finalInit = initial(node)
    node.input(
      typeof finalInit === 'object' ? init(finalInit) : finalInit,
      false
    )
    // release the events.
    node._e.play(node)
    return node
  }
  warn(152, id)
  return
}
