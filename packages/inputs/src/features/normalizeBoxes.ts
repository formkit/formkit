import { FormKitMiddleware, FormKitNode } from '@formkit/core'
import { extend, slugify } from '@formkit/utils'

/**
 * A feature that normalizes box types (checkboxes, radios).
 *
 * @param node - A {@link @formkit/core#FormKitNode | FormKitNode}.
 *
 * @returns A {@link @formkit/node#FormKitMiddleware | FormKitMiddleware}.
 *
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
            attrs: {
              id: `${node.name}-option-${slugify(String(option.value))}`,
            },
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
