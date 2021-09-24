import { FormKitSchemaNode } from '@formkit/schema'

const schema: FormKitSchemaNode[] = [
  {
    $el: 'h1',
    for: ['total', 'key', '$quantity'],
    if: '($value * $key) % 2 === 0',
    children: ['$key', ': ', '$value * $key + $key', ' is even!'],
  },
]

export default schema
