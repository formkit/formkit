import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const inner: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.inner',
  then: '$slots.inner',
  else: extend(
    {
      $el: 'div',
      attrs: {
        class: '$classes.inner',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default inner
