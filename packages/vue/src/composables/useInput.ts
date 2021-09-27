import { createNode, FormKitNode, FormKitNodeType } from '@formkit/core'
import { has } from 'packages/utils/dist'
import { reactive } from 'vue'

/**
 * A composable for creating a new FormKit node.
 * @param type - The type of node (input, group, list)
 * @param attrs - The FormKit "props" — which is really the attrs list.
 * @returns
 */
export function useInput(
  type: FormKitNodeType,
  attrs: Record<string, any>
): [Record<string, any>, FormKitNode] {
  const data = reactive({})
  const name = has(attrs, 'name') ? attrs.name : null
  const value = has(attrs, 'value') ? attrs.value : null
  const node = createNode({ type, name, value })
  return [data, node]
}
