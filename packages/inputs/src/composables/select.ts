import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const select: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.input',
  then: '$slots.input',
  else: extend(
    {
      $el: 'select',
      attrs: {
        type: '$type',
        class: '$classes.input',
        name: '$node.name',
        onInput: '$input',
        value: '$_value',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default select
