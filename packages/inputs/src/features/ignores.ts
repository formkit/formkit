import { FormKitNode } from '@formkit/core'

/**
 * Applies ignore="true" by default.
 * @param node - The node
 * @public
 */
export default function ignore(node: FormKitNode): void {
  if (node.props.ignore === undefined) {
    node.props.ignore = true
    node.parent = null
  }
}
