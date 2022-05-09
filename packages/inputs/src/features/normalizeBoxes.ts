import { FormKitMiddleware, FormKitNode } from '@formkit/core'
import { extend, kebab } from '@formkit/utils'

/**
 * Normalize the boxes.
 * @param node - The node
 * @returns
 * @public
 */
export default function normalizeBoxes(
  node: FormKitNode
): FormKitMiddleware<{ prop: string | symbol; value: any }> {
  return function (prop, next) {
    if (prop.prop === 'options' && Array.isArray(prop.value)) {
      prop.value = prop.value.map((option) => {
        if (!option.attrs?.id) {
          return extend(option, {
            attrs: { id: `${node.name}-option-${kebab(String(option.value))}` },
          })
        }
        return option
      })
      if (node.props.type === 'checkbox' && !Array.isArray(node.value)) {
        if (node.isCreated) {
          node.input([], false)
        } else {
          node.on('created', () => {
            if (!Array.isArray(node.value)) {
              node.input([], false)
            }
          })
        }
      }
    }
    return next(prop)
  }
}
