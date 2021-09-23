import { FormKitSchemaNode } from '@formkit/schema'

const schema: FormKitSchemaNode[] = [
  {
    $el: 'h1',
    // for: ['value', 10],
    children: ['Hello world', '$location.planet'],
  },
  {
    $el: 'h1',
    // for: ['value', 10],
    children: ['Hello world', '$location.planet'],
  },
  {
    $el: 'h1',
    // for: ['value', 10],
    children: ['Hello world', '$location.planet'],
  },
]

export default schema
