import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const decorator: FormKitSchemaComposable = (schema = {}) => ({
  if: '$slots.decorator',
  then: '$slots.decorator',
  else: extend(
    {
      $el: 'span',
      attrs: {
        class: '$classes.decorator',
        'aria-hidden': 'true',
      },
    },
    schema
  ) as FormKitSchemaNode,
})

export default decorator
