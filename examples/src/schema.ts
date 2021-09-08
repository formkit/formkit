import { FormKitSchemaNode } from '@formkit/schema'

const schema: FormKitSchemaNode[] = [
  {
    $el: 'fieldset',
    children: [
      {
        $node: 'input',
        type: 'input',
        name: 'foobar',
        value: 'abc',
        props: {
          label: 'Birthday',
        },
        children: [
          {
            $el: 'label',
            children: '$input.props.label',
          },
          {
            $el: 'input',
            attrs: {
              // value: '$input._value',
              onInput: '$input.input',
            },
          },
          {
            $el: 'h1',
            children: '$input.value.value',
          },
        ],
      },
    ],
  },
]

export default schema
