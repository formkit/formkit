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
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default outer
