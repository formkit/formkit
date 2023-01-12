import { FormKitNode } from '@formkit/core'

/**
 * A feature that applies ignore="true" by default.
 *
 * @param node - A {@link @formkit/core#FormKitNode | FormKitNode}.
 *
 * @public
 */
export default function ignore(node: FormKitNode): void {
  if (node.props.ignore === undefined) {
    node.props.ignore = true
    node.parent = null
  }
}
