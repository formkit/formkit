import { FormKitSchemaNode } from '@formkit/core'

export const multiStepSchema: FormKitSchemaNode[] = [
  {
    $el: 'div',
    attrs: {
      'data-type': 'multi-step',
      class: '$classes.multiStep',
    },
    children: [
      {
        $el: 'ul',
        attrs: {
          class: '$classes.tabs',
        },
        children: [
          {
            $el: 'li',
            for: ['step', 'key', '$steps'],
            attrs: {
              class: '$classes.tab',
              onClick: '$handlers.setActiveStep($step)',
            },
            children: ['$step.name'],
          },
        ],
      },
      {
        $el: 'div',
        attrs: {
          class: '$classes.multiStepInner',
        },
        children: ['$slots.default'],
      },
    ],
  },
]

export const stepSchema: FormKitSchemaNode[] = [
  {
    $el: 'div',
    if: '$isActiveStep',
    attrs: {
      'data-type': 'step',
      class: '$classes.step',
    },
    children: ['$slots.default'],
  },
]
