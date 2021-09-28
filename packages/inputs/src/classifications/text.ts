import { FormKitSchemaNode } from '@formkit/schema'

/**
 * The schema for text classifications.
 * @public
 */
const textSchema: FormKitSchemaNode[] = [
  {
    $el: 'div',
    attrs: {
      class: '$outerClasses',
    },
    children: [
      {
        $el: 'div',
        attrs: {
          class: '$wrapperClasses',
        },
        children: [
          {
            $el: 'label',
            if: '$label',
            attrs: {
              class: '$labelClasses',
              for: '$id',
            },
            children: '$label',
          },
          {
            $el: 'div',
            attrs: {
              class: '$innerClasses',
            },
            children: [
              {
                $el: 'input',
                attrs: {
                  type: '$type',
                  name: '$node.name',
                  onInput: '$input',
                  value: '$_value',
                },
              },
            ],
          },
        ],
      },
      {
        $el: 'div',
        attrs: {
          class: '$helpClasses',
        },
        if: '$help',
        children: '$help',
      },
      {
        $el: 'ul',
        children: [
          {
            $el: 'li',
            for: ['message', '$messages'],
            attrs: {
              class: '$message.classes',
            },
            children: '$message.value',
          },
        ],
      },
    ],
  },
]

export default textSchema
