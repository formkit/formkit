import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const boxLabel: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.label',
  then: '$slots.label',
  else: [
    extend(
      {
        $el: 'span',
        if: '$label',
        attrs: {
          class: '$classes.label',
        },
        children,
      },
      schema
    ) as FormKitSchemaNode,
  ],
})
export default boxLabel
