import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const wrapper: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.options',
  then: '$slots.options',
  else: extend(
    {
      $el: 'ul',
      attrs: {
        class: '$classes.options',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default wrapper
