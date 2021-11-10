import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const legend: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.legend',
  then: '$slots.legend',
  else: extend(
    {
      $el: 'legend',
      attrs: {
        class: '$classes.legend',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default legend
