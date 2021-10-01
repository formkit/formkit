import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/schema'
import { extend } from '@formkit/utils'

const text: FormKitSchemaComposable = (schema = {}) =>
  extend(
    {
      $el: 'input',
      attrs: {
        type: '$type',
        class: '$classes.input',
        name: '$node.name',
        onInput: '$input',
        value: '$_value',
      },
    },
    schema
  ) as FormKitSchemaNode

export default text
