import { FormKitMiddleware, FormKitNode } from '@formkit/core'
import { extend, kebab } from '@formkit/utils'

export default function (
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
      if (node.props.type === 'checkbox' && node.value === undefined) {
        // Force the value to an array
        node.input([], false)
      }
    }
    return next(prop)
  }
}
