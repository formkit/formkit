import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const boxes: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.boxes',
  then: '$slots.boxes',
  else: [
    extend(
      {
        $el: 'div',
        for: ['option', '$options'],
        attrs: {
          class: '$classes.boxes',
        },
        children,
      },
      schema
    ) as FormKitSchemaNode,
  ],
})
export default boxes
