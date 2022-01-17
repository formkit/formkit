import { FormKitNode, createMessage } from '@formkit/core'

/**
 * Apply the files to the framework context
 */
declare module '@formkit/core' {
  export interface FormKitFrameworkContext {
    files: Array<{ name: string }>
  }
}

export default function (node: FormKitNode): void {
  // Create the "noFiles" ui language.
  node.store.set(
    createMessage({
      type: 'ui',
      key: 'noFiles',
      meta: {
        i18nArgs: [{ node }],
      },
      value: 'Select file',
    })
  )

  node.on('created', () => {
    if (!node.context) return
    node.context.files = []

    node.context.handlers.files = (e: Event) => {
      if (e.target instanceof HTMLInputElement && e.target.files) {
        console.log(e.target.files)
      }
    }
  })
}
