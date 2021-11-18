import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const form: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.form',
  then: '$slots.form',
  else: extend(
    {
      $el: 'form',
      bind: '$attrs',
      attrs: {
        class: '$classes.form',
        name: '$node.name',
        onSubmit: '$handlers.submit',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default form
