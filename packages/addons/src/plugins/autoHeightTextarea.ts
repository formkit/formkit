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
    node.addProps(['autoHeight', 'maxAutoHeight'])

    node.on('created', () => {
      const autoHeight = undefine(node.props.autoHeight)
      const maxAutoHeight = Number.isFinite(node.props.maxAutoHeight)
        ? parseInt(node.props.maxAutoHeight)
        : undefined
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

          function calculateHeight() {
            if (!inputElement) return
            let scrollHeight = (inputElement as HTMLElement).scrollHeight
            inputElement?.setAttribute('style', `min-height: 0px`)
            scrollHeight = (inputElement as HTMLElement).scrollHeight
            const h = maxAutoHeight
              ? Math.min(scrollHeight, maxAutoHeight)
              : scrollHeight
            inputElement?.setAttribute('style', `min-height: ${h}px`)
          }
        },
        node.props.__root
      )
    })
  }

  return autoHeightTextareaPlugin
}
