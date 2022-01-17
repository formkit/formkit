import { FormKitNode } from '@formkit/core'

export default function (node: FormKitNode): void {
  node.on('created', () => {
    if (!node.context) return
    node.context.handlers.files = (e: Event) => {
      if (e.target instanceof HTMLInputElement && e.target.files) {
        console.log(e.target.files)
      }
    }
  })
}
