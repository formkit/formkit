import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/schema'
import { extend } from '@formkit/utils'

const options: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.options',
  then: '$slots.options',
  else: extend(
    {
      $el: 'option',
      if: '$fns.length($options)',
      for: ['label', 'value', '$options'],
      attrs: {
        class: '$classes.option',
        value: '$value',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default options
