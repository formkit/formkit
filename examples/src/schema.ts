import { FormKitSchemaNode } from '@formkit/schema'

const schema: FormKitSchemaNode[] = [
  {
    $el: 'fieldset',
    key: 'abc',
    children: [
      {
        $node: 'input',
        name: 'text',
        type: 'input',
        props: {
          label: 'Schema node!',
        },
        value: 'Hello world!',
        children: [
          {
            $el: 'label',
            children: '$input.props.label',
          },
          {
            $el: 'input',
            attrs: {
              name: '$input.name',
              value: '$input.node._value',
              onInput: '$input.input',
            },
          },
          {
            $el: 'h1',
            children: '$input.value',
          },
        ],
      },
    ],
  },
]

export default schema
