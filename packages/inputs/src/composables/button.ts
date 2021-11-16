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
          else: 'Submit',
        },
      },
    },
    schema
  ) as FormKitSchemaNode,
})

export default button
