import { createSection } from '@formkit/inputs'

/**
 * Contains the "previous" action element for a multi-step step.
 *
 * @public
 */
export const stepPrevious = createSection('stepPrevious', () => ({
  $el: 'div',
  children: [
    {
      $formkit: 'button',
      label: {
        if: '$prevLabel',
        then: '$prevLabel',
        else: 'Back',
      },
      onClick: '$handlers.incrementStep(-1, $node.context)',
    },
  ],
}))
