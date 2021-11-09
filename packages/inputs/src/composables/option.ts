import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const option: FormKitSchemaComposable = (schema = {}, children = []) => ({
  if: '$slots.option',
  then: [
    {
      $el: 'text',
      if: '$options.length',
      for: ['option', '$options'],
      children: '$slots.option',
    },
  ],
  else: extend(
    {
      $el: 'option',
      if: '$options.length',
      for: ['option', '$options'],
      bind: '$option.attrs',
      attrs: {
        class: '$classes.option',
        value: '$option.value',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode,
})

export default option
