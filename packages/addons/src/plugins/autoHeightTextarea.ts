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

          const hiddenTextarea = inputElement.cloneNode(
            false
          ) as HTMLTextAreaElement
          hiddenTextarea.setAttribute(
            'style',
            'height: 0; min-height: 0; position: absolute; padding-top: 0; padding-bottom: 0; display: block; pointer-events: none; opacity: 0;  left: -9999px;'
          )
          hiddenTextarea.removeAttribute('name')
          hiddenTextarea.removeAttribute('id')
          const isBorderBox =
            getComputedStyle(inputElement).boxSizing === 'border-box'
          const paddingY =
            parseInt(getComputedStyle(inputElement).paddingTop) +
            parseInt(getComputedStyle(inputElement).paddingBottom)
          const paddingX =
            parseInt(getComputedStyle(inputElement).paddingTop) +
            parseInt(getComputedStyle(inputElement).paddingBottom)

          inputElement.after(hiddenTextarea)
          calculateHeight({ payload: node._value as string })

          node.on('input', calculateHeight)

          function calculateHeight({ payload }: { payload: string }) {
            if (!inputElement) return
            hiddenTextarea.value = payload

            const width = isBorderBox
              ? inputElement.offsetWidth
              : inputElement.offsetWidth - paddingX
            hiddenTextarea.style.width = `${width}px`

            const scrollHeight = hiddenTextarea.scrollHeight
            const height = isBorderBox ? scrollHeight + paddingY : scrollHeight
            const h = maxAutoHeight ? Math.min(height, maxAutoHeight) : height
            if (!inputElement.style.height) {
              inputElement.style.height = `0px`
            }
            inputElement.style.minHeight = `${h}px`
          }
        },
        node.props.__root
      )
    })
  }

  return autoHeightTextareaPlugin
}
