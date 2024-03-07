import type { FormKitFrameworkContext, FormKitGroupValue } from '@formkit/core'
import { parentSymbol } from '../FormKit'
import { ref, inject, onUnmounted } from 'vue'
import type { Ref } from 'vue'

/**
 * Get the formkit context for the current component. This *MUST* be used in a
 * component that is a child of a `FormKit` component.
 * @param address - A traversal address to a specific node in the form.
 */
export function useFormKitContext<
  A extends string | undefined,
  T = A extends string ? unknown : FormKitGroupValue
>(address: A): Ref<FormKitFrameworkContext<T> | undefined> {
  const context = ref<FormKitFrameworkContext<T> | undefined>()
  const parentNode = inject(parentSymbol, null)

  if (__DEV__ && !parentNode) {
    console.warn(
      'useFormKitContext must be used as a child of a FormKit component.'
    )
  }
  if (parentNode && address) {
    const root = parentNode.at('$root')
    if (root) {
      const receipt = root.on('child.deep', () => {
        const targetNode = parentNode.at(address)
        if (targetNode && targetNode.context !== context.value) {
          context.value = targetNode.context
        }
      })
      onUnmounted(() => {
        root.off(receipt)
      })
    }
    context.value = parentNode.at(address)?.context
  }
  return context
}

// export function useFormKitContextById<T = any>(
//   id: string,
//   effect?: (context: FormKitFrameworkContext<T>) => void
// ): Ref<FormKitFrameworkContext<T> | undefined> {
//   // ...
// }

// export function useFormKitNodeById<T>(
//   id: string,
//   effect?: (node: FormKitNode<T>) => void
// ): Ref<FormKitFrameworkContext | undefined> {
//   // ...
// }
