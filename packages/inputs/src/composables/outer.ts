import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const outer: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.outer',
  then: '$slots.outer',
  else: extend(
    {
      $el: 'div',
      attrs: {
        class: '$classes.outer',
        'data-type': '$type',
        'data-multiple': '$attrs.multiple',
        'data-disabled': '$attrs.disabled',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default outer
