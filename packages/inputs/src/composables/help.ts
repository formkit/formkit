import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/schema'
import { extend } from '@formkit/utils'

const help: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.help',
  then: '$slots.help',
  else: extend(
    {
      $el: 'div',
      attrs: {
        class: '$classes.help',
      },
      if: '$help',
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default help
