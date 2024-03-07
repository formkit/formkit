import {
  getNode,
  type FormKitFrameworkContext,
  type FormKitGroupValue,
  watchRegistry,
} from '@formkit/core'
import { parentSymbol } from '../FormKit'
import { ref, inject, onUnmounted } from 'vue'
import type { Ref } from 'vue'

/**
 * Uses the FormKit context to access the current FormKit context. This must be
 * used in a component that is a child of the FormKit component.
 * @param effect - An optional effect callback to run when the context is available.
 */
export function useFormKitContext<T = FormKitGroupValue>(
  effect?: (context: FormKitFrameworkContext<T>) => void
): Ref<FormKitFrameworkContext<T> | undefined>
/**
 * Allows access to a specific context by address.
 * @param address - An optional address of the context to access.
 * @param effect - An optional effect callback to run when the context is available.
 */
export function useFormKitContext<T = FormKitGroupValue>(
  address?: string,
  effect?: (context: FormKitFrameworkContext<T>) => void
): Ref<FormKitFrameworkContext<T> | undefined>
export function useFormKitContext<T = FormKitGroupValue>(
  addressOrEffect?: string | ((context: FormKitFrameworkContext<T>) => void),
  optionalEffect?: (context: FormKitFrameworkContext<T>) => void
): Ref<FormKitFrameworkContext<T> | undefined> {
  const address =
    typeof addressOrEffect === 'string' ? addressOrEffect : undefined
  const effect =
    typeof addressOrEffect === 'function' ? addressOrEffect : optionalEffect
  const context = ref<FormKitFrameworkContext<T> | undefined>()
  const parentNode = inject(parentSymbol, null)
  if (__DEV__ && !parentNode) {
    console.warn(
      'useFormKitContext must be used as a child of a FormKit component.'
    )
  }
  if (parentNode) {
    if (address) {
      context.value = parentNode.at(address)?.context
      const root = parentNode.at('$root')
      if (root) {
        const receipt = root.on('child.deep', () => {
          const targetNode = parentNode.at(address)
          if (targetNode && targetNode.context !== context.value) {
            context.value = targetNode.context as FormKitFrameworkContext<T>
            if (effect) effect(context.value)
          }
        })
        onUnmounted(() => {
          root.off(receipt)
        })
      }
    } else {
      context.value = parentNode?.context
    }
  }
  if (context.value && effect) effect(context.value)
  return context
}

/**
 * Allows global access to a specific context by id. The target node MUST have
 * an explicitly defined id.
 * @param id - The id of the node to access the context for.
 * @param effect - An effect callback to run when the context is available.
 */
// export function useFormKitContextById<T = any>(
//   id: string,
//   effect?: (context: FormKitFrameworkContext<T>) => void
// ): Ref<FormKitFrameworkContext<T> | undefined> {
//   const context = ref<FormKitFrameworkContext<T> | undefined>()
//   const targetNode = getNode(id)
//   if (targetNode)
//     context.value = targetNode.context as FormKitFrameworkContext<T>
//   if (!targetNode) {
//     watchRegistry(id, () => {

//     })
//   }
// }

// export function useFormKitNodeById<T>(
//   id: string,
//   effect?: (node: FormKitNode<T>) => void
// ): Ref<FormKitFrameworkContext | undefined> {
//   // ...
// }
