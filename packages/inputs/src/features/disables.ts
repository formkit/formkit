import type { FormKitNode } from '@formkit/core'
import { undefine } from '@formkit/utils'

/**
 * A feature that allows disabling children of this node.
 *
 * @param node - A {@link @formkit/core#FormKitNode | FormKitNode}.
 *
 * @public
 */
export default function disables(node: FormKitNode): void {
  node.on('created', () => {
    // If the disabled prop belongs to this *actual* node (not inherited), then
    // perform an `undefine` on it, if not then we'll let the prop be inherited.
    if ('disabled' in node.props) {
      node.props.disabled = undefine(node.props.disabled)
      node.config.disabled = undefine(node.props.disabled)
    }
  })
  node.hook.prop(({ prop, value }, next) => {
    value = prop === 'disabled' ? undefine(value) : value
    return next({ prop, value })
  })
  node.on('prop:disabled', ({ payload: value }) => {
    node.config.disabled = undefine(value)
  })
}
