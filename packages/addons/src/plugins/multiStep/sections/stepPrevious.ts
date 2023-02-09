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
      bind: '$previousAttrs',
      props: {
        type: 'button',
        label: {
          if: '$previousLabel',
          then: '$previousLabel',
          else: '$ui.prev.value',
        },
        'data-prev': '$isFirstStep === false',
        onClick: '$handlers.previous',
      },
    },
  ],
}))
