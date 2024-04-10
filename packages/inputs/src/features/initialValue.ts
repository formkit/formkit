import type { FormKitNode } from '@formkit/core'

/**
 * A feature that ensures the input has an `initialValue` prop.
 *
 * @param node - A {@link @formkit/core#FormKitNode | FormKitNode}.
 *
 * @public
 */
export default function initialValue(node: FormKitNode): void {
  node.on('created', () => {
    if (node.context) {
      node.context.initialValue = node.value || ''
    }
  })
}
