import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/schema'
import { extend } from '@formkit/utils'

const label: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.label',
  then: '$slots.label',
  else: [
    extend(
      {
        $el: 'label',
        if: '$label',
        attrs: {
          for: '$id',
        },
        children,
      },
      schema
    ) as FormKitSchemaNode,
  ],
})
export default label
