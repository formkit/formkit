import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const button: FormKitSchemaComposable = (schema = {}) => ({
  if: '$slots.input',
  then: '$slots.input',
  else: extend(
    {
      $el: 'button',
      bind: '$attrs',
      attrs: {
        type: '$type',
        disabled: '$disabled',
        class: '$classes.input',
        name: '$node.name',
        id: '$id',
      },
      children: {
        if: '$slots.default',
        then: '$slots.default',
        else: {
          if: '$label',
          then: '$label',
          else: '$ui.submit.value',
        },
      },
    },
    schema
  ) as FormKitSchemaNode,
})

export default button
