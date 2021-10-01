import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/schema'
import { extend } from '@formkit/utils'

const wrapper: FormKitSchemaComposable = (schema = {}, children = []) =>
  extend(
    {
      $el: 'div',
      attrs: {
        class: '$classes.wrapper',
      },
      children,
    },
    schema
  ) as FormKitSchemaNode

export default wrapper
