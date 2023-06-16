import { createSection } from '@formkit/inputs'

/**
 * Contains the "next" action element for a multi-step step.
 *
 * @public
 */
export const stepNext = createSection('stepNext', () => ({
  $el: 'div',
  if: '$isLastStep === false || $stepIndex === 0',
  children: [
    {
      $cmp: 'FormKit',
      bind: '$nextAttrs',
      props: {
        type: 'button',
        label: {
          if: '$nextLabel',
          then: '$nextLabel',
          else: '$ui.next.value',
        },
        'data-next': '$isLastStep === false',
        onClick: '$handlers.next',
      },
    },
  ],
}))
