import { FormKitSchemaNode } from '@formkit/schema'

const group: FormKitSchemaNode[] = [
  {
    $el: 'div',
    children: ['hello', '$slots.default'],
  },
]

export default group
