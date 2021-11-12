import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const boxes: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.option',
  then: '$slots.option',
  else: [
    extend(
      {
        $el: 'li',
        for: ['option', '$options'],
        attrs: {
          class: '$classes.option',
          'data-disabled': '$option.attrs.disabled',
        },
        children,
      },
      schema
    ) as FormKitSchemaNode,
  ],
})
export default boxes
