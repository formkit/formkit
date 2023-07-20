import { FormKitNode, FormKitPlugin } from '@formkit/core'
import { undefine, whenAvailable } from '@formkit/utils'

/**
 * Creates a new auto-height textarea plugin.
 *
 * @returns A {@link @formkit/core#FormKitPlugin | FormKitPlugin}
 *
 * @public
 */
export function createAutoHeightTextareaPlugin(): FormKitPlugin {
  const autoHeightTextareaPlugin = (node: FormKitNode) => {
    if (node.props.type !== 'textarea') return
    node.addProps(['autoHeight'])

    node.on('created', () => {
      const autoHeight = undefine(node.props.autoHeight)
      if (!autoHeight || !node.context) return
      let inputElement: HTMLElement | undefined | null = null

      whenAvailable(
        node.context.id,
        () => {
          inputElement = node.props.__root?.getElementById(
            node?.context?.id ? node.context.id : ''
          )
          if (!(inputElement instanceof HTMLTextAreaElement)) return

          calculateHeight()

          node.on('commit', async () => {
            await Promise.resolve()
            calculateHeight()
          })

          function calculateHeight() {
            if (!inputElement) return
            inputElement?.setAttribute('style', `min-height: 0px`)
            const scrollHeight = (inputElement as HTMLElement).scrollHeight
            inputElement?.setAttribute('style', `min-height: ${scrollHeight}px`)
          }
        },
        node.props.__root
      )
    })
  }

  return autoHeightTextareaPlugin
}
