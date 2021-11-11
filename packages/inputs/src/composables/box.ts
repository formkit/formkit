import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const box: FormKitSchemaComposable = (schema = {}) => ({
  if: '$slots.input',
  then: '$slots.input',
  else: extend(
    {
      $el: 'input',
      bind: '$attrs',
      attrs: {
        type: '$type',
        class: '$classes.input',
        name: '$node.name',
        onInput: '$handlers.DOMInput',
        onBlur: '$handlers.blur',
        checked: '$_value',
        value: '$: true',
        id: '$id',
        'aria-describedby': {
          if: '$options.length',
          then: {
            if: '$option.help',
            then: '$: "help-" + $option.attrs.id',
            else: undefined,
          },
          else: {
            if: '$help',
            then: '$: "help-" + $id',
            else: undefined,
          },
        },
      },
    },
    schema
  ) as FormKitSchemaNode,
})

export default box
