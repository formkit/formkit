import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/schema'
import { extend } from '@formkit/utils'

const outer: FormKitSchemaComposable = (schema = {}, children = []) =>
  extend(
    {
      $el: 'div',
      attrs: {
        class: '$classes.outer',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode

export default outer
