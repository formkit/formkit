import { FormKitSchemaNode } from '@formkit/schema'

const schema: FormKitSchemaNode[] = [
  {
    $el: 'div',
    children: [
      {
        $el: 'h1',
        if: '(andrew === "andrew")',
        children: 'SHOWING',
      },
    ],
  },
]

export default schema
