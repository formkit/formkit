import { createSection } from '@formkit/inputs'

/**
 * Contains the "next" action element for a multi-step step.
 *
 * @public
 */
export const stepNext = createSection('stepNext', () => ({
  $el: 'div',
  if: '$isLastStep === false',
  children: [
    {
      $formkit: 'button',
      label: {
        if: '$nextLabel',
        then: '$nextLabel',
        else: '$ui.next.value',
      },
      onClick: '$handlers.incrementStep(1, $node.context)',
    },
  ],
}))
