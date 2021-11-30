import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const textarea: FormKitSchemaComposable = (schema = {}) => ({
  if: '$slots.input',
  then: '$slots.input',
  else: extend(
    {
      $el: 'textarea',
      bind: '$attrs',
      attrs: {
        class: '$classes.input',
        disabled: '$disabled',
        name: '$node.name',
        onInput: '$handlers.DOMInput',
        onBlur: '$handlers.blur',
        value: '$_value',
        id: '$id',
      },
    },
    schema
  ) as FormKitSchemaNode,
})

export default textarea
