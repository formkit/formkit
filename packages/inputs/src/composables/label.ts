import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/schema'
import { extend } from '@formkit/utils'

const label: FormKitSchemaComposable = (schema = {}, children = []) =>
  extend(
    {
      $el: 'label',
      attrs: {
        for: '$id',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode

export default label
