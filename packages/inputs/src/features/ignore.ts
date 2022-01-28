import { FormKitNode } from '@formkit/core'

/**
 * Applies ignore="true" by default.
 * @param node - The node
 */
export default function (node: FormKitNode): void {
  if (node.props.ignore === undefined) {
    node.props.ignore = true
    node.parent = null
  }
}
