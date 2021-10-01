import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/schema'
import { extend } from '@formkit/utils'

const label: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.foobar',
  then: '$slots.foobar',
  else: [
    extend(
      {
        $el: 'label',
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
