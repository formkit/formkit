import { FormKitSchemaNode } from '@formkit/core'

export const multiStepSchema: FormKitSchemaNode[] = [
  {
    $el: 'div',
    attrs: {
      'data-type': 'multi-step',
      class: '$classes.outer',
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
          class: '$classes.wrapper',
        },
        children: [
          {
            $el: 'div',
            attrs: {
              class: '$classes.inner',
            },
            children: '$slots.default',
          },
        ],
      },
    ],
  },
]

export const stepSchema: FormKitSchemaNode[] = [
  {
    $el: 'div',
    attrs: {
      'data-type': 'step',
      class: '$classes.step',
      style: {
        if: '$isActiveStep',
        then: '',
        else: 'display: none;',
      },
    },
    children: [
      {
        $el: 'div',
        attrs: {
          class: '$classes.stepInner',
        },
        children: '$slots.default',
      },
      {
        $el: 'div',
        attrs: {
          class: '$classes.stepActions',
        },
        children: [
          {
            $el: 'div',
            if: '$: !$isFirstStep',
            attrs: {
              class: '$classes.actionPrevious',
            },
            children: [
              {
                $formkit: 'button',
                label: {
                  if: '$prevLabel',
                  then: '$prevLabel',
                  else: 'Previous',
                },
              },
            ],
          },
          {
            $el: 'div',
            attrs: {
              class: '$classes.actionNext',
            },
            children: [
              {
                $formkit: 'button',
                label: {
                  if: '$nextLabel',
                  then: '$nextLabel',
                  else: 'Next',
                },
              },
            ],
          },
        ],
      },
    ],
  },
]
