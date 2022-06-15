import { FormKitNode } from '@formkit/core'

/**
 * Ensures the input has an `initialValue` prop.
 * @param node - The node being given an initial value
 * @public
 */
export default function initialValue(node: FormKitNode): void {
  node.on('created', () => {
    if (node.context) {
      node.context.initialValue = node.value || ''
    }
  })
}
