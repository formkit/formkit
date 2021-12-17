import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const actions: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.actions',
  then: '$slots.actions',
  else: [
    extend(
      {
        $el: 'div',
        if: '$actions',
        attrs: {
          class: '$classes.actions',
        },
        children,
      },
      schema
    ) as FormKitSchemaNode,
  ],
})
export default actions
