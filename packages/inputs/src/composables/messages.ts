import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/schema'
import { extend } from '@formkit/utils'

const messages: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.messages',
  then: '$slots.messages',
  else: extend(
    {
      $el: 'ul',
      if: '$fns.length($messages)',
      attrs: {
        class: '$classes.messages',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default messages
