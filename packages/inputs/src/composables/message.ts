import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/schema'
import { extend } from '@formkit/utils'

const message: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.message',
  then: '$slots.message',
  else: extend(
    {
      $el: 'li',
      for: ['message', '$messages'],
      attrs: {
        class: '$message.classes',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default message
