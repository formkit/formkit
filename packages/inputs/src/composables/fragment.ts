import { FormKitSchemaNode, FormKitSchemaComposable } from '@formkit/core'
import { extend } from '@formkit/utils'

const fragment: FormKitSchemaComposable = (schema = {}, children = []) =>
  (Object.keys(schema).length || typeof children !== 'string'
    ? extend({ $el: 'div', children }, schema)
    : children) as FormKitSchemaNode

export default fragment
