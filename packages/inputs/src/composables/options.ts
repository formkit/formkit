import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const options: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.options',
  then: '$slots.options',
  else: extend(
    {
      $el: 'option',
      if: '$options.length',
      for: ['option', '$options'],
      attrs: {
        class: '$classes.option',
        value: '$option.value',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default options
