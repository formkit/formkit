import { FormKitNode } from '@formkit/core'

export default function initialValue(node: FormKitNode): void {
  node.on('created', () => {
    if (node.context) {
      node.context.initialValue = node.value || ''
    }
  })
}
