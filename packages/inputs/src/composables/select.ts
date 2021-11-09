import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const select: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.input',
  then: '$slots.input',
  else: extend(
    {
      $el: 'select',
      bind: '$attrs',
      attrs: {
        'data-placeholder': {
          if: '$placeholder',
          then: {
            if: '$value',
            then: undefined,
            else: 'true',
          },
        },
        class: '$classes.input',
        name: '$node.name',
        onInput: '$handlers.DOMInput',
        value: '$_value',
      },
      children: {
        if: '$slots.default',
        then: '$slots.default',
        else: children,
      },
    },
    schema
  ) as FormKitSchemaNode,
})

export default select
