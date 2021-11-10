import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const fieldset: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.fieldset',
  then: '$slots.fieldset',
  else: extend(
    {
      $el: 'fieldset',
      attrs: {
        class: '$classes.fieldset',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default fieldset
