import { FormKitSchemaAttributes } from '@formkit/core'

export default function textAttrs(): FormKitSchemaAttributes {
  return {
    type: '$type',
    disabled: '$disabled',
    name: '$node.name',
    onInput: '$handlers.DOMInput',
    onBlur: '$handlers.blur',
    value: '$_value',
    id: '$id',
    'aria-describedby': '$describedBy',
  }
}
