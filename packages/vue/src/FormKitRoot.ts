import { h, ref, watch, provide, InjectionKey, Ref } from 'vue'
import { defineComponent } from 'vue'

/**
 * The symbol that represents the formkit’s root element injection value.
 *
 * @public
 */
export const rootSymbol: InjectionKey<Ref<Document | ShadowRoot | undefined>> =
  Symbol()

/**
 * The FormKitRoot wrapper component used to provide context to FormKit about
 * whether a FormKit input is booting in a Document or ShadowRoot. This is
 * generally only necessary when booting FormKit nodes in contexts that do not
 * have a document. For example, if running code like this:
 *
 * ```ts
 * document.getElementById(node.props.id)
 * ```
 *
 * does not work because the `document` is not available or is not in the same
 * scope, you can place a `<FormKitRoot>` component somewhere near the root of
 * of your shadowRoot and it will inform any FormKitNode child (at any depth)
 * that it is running in a shadow root. The "root" (`Document` or `ShadowRoot`)
 * will be made available to all child nodes at `node.context._root`
 *
 * @public
 */
export const FormKitRoot = defineComponent((_p, context) => {
  const boundary = ref<null | HTMLElement>(null)
  const showBody = ref(false)
  const shadowRoot = ref<Document | ShadowRoot | undefined>(undefined)

  const stopWatch = watch(boundary, (el) => {
    let parent: Node | null | undefined = el
    let root: null | Node = null
    while ((parent = parent?.parentNode)) {
      root = parent
      if (root instanceof ShadowRoot || root instanceof Document) {
        foundRoot(root)
        break
      }
    }
    stopWatch()
    showBody.value = true
  })
  provide(rootSymbol, shadowRoot)

  function foundRoot(root: Document | ShadowRoot) {
    shadowRoot.value = root
  }

  return () =>
    showBody.value && context.slots.default
      ? context.slots.default()
      : h('template', { ref: boundary })
})
