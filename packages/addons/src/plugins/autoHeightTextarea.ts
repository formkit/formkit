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
      let inputElement: null | HTMLElement = null

      whenAvailable(node.context.id, () => {
        inputElement = document.getElementById(
          node?.context?.id ? node.context.id : ''
        )
        calculateHeight()

        node.on('input', () => {
          Promise.resolve().then(() => calculateHeight())
        })

        function calculateHeight() {
          if (!inputElement) return
          let scrollHeight = (inputElement as HTMLElement).scrollHeight
          inputElement?.setAttribute('style', `min-height: 0px`)
          scrollHeight = (inputElement as HTMLElement).scrollHeight
          inputElement?.setAttribute('style', `min-height: ${scrollHeight}px`)
        }
      },
      node.props.__root)
    })
  }

  return autoHeightTextareaPlugin
}
