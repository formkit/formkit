import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const fieldset: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.fieldset',
  then: '$slots.fieldset',
  else: extend(
    {
      $el: 'fieldset',
      attrs: {
        id: '$id',
        class: '$classes.fieldset',
        'aria-describedby': {
          if: '$help',
          then: '$: "help-" + $id',
          else: undefined,
        },
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default fieldset
