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

          if (!document.getElementById('formkit-auto-height-textarea-style')) {
            const scrollbarStyle = document.createElement('style')
            scrollbarStyle.setAttribute(
              'id',
              'formkit-auto-height-textarea-style'
            )
            scrollbarStyle.textContent = `.formkit-auto-height-textarea { scrollbar-width: none; } .formkit-auto-height-textarea::-webkit-scrollbar { display: none; }`
            document.body.appendChild(scrollbarStyle)
          }

          const hiddenTextarea = inputElement.cloneNode(
            false
          ) as HTMLTextAreaElement
          hiddenTextarea.classList.add('formkit-auto-height-textarea')
          if (!maxAutoHeight) {
            inputElement.classList.add('formkit-auto-height-textarea')
          }

          hiddenTextarea.setAttribute(
            'style',
            'height: 0; min-height: 0; pointer-events: none; opacity: 0;  left: -9999px; padding-top: 0; padding-bottom: 0; position: absolute; display: block; top: 0; z-index: -1; scrollbar-width: none;'
          )
          hiddenTextarea.removeAttribute('name')
          hiddenTextarea.removeAttribute('id')
          hiddenTextarea.removeAttribute('aria-describedby')
          const isBorderBox =
            getComputedStyle(inputElement).boxSizing === 'border-box'
          const paddingY =
            parseInt(getComputedStyle(inputElement).paddingTop) +
            parseInt(getComputedStyle(inputElement).paddingBottom)

          const paddingX =
            parseInt(getComputedStyle(inputElement).paddingTop) +
            parseInt(getComputedStyle(inputElement).paddingBottom)
          let lastValue = node._value

          inputElement.after(hiddenTextarea)
          calculateHeight({ payload: node._value as string })

          node.on('input', calculateHeight)
          async function calculateHeight({ payload }: { payload: string }) {
            lastValue = payload
            if (!inputElement) return
            await new Promise((r) => setTimeout(r, 10))

            // If the current value is not the one we enqueued, just ignore.
            if (lastValue !== payload) return

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
