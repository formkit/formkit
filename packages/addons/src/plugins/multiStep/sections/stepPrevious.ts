import { createSection } from '@formkit/inputs'

/**
 * Contains the "previous" action element for a multi-step step.
 *
 * @public
 */
export const stepPrevious = createSection('stepPrevious', () => ({
  $el: 'div',
  if: '$isFirstStep === false',
  children: [
    {
      $cmp: 'FormKit',
      bind: '$prevAttrs',
      props: {
        type: 'button',
        label: {
          if: '$prevLabel',
          then: '$prevLabel',
          else: '$ui.prev.value',
        },
        'data-prev': '$isFirstStep === false',
        onClick: '$handlers.incrementStep(-1, $node.context)',
      },
    },
  ],
}))
