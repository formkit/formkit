import { createSection } from '@formkit/inputs'

/**
 * Outer section of a multi-step step. Has conditinal styling
 * depending on if it's the $activeStep.
 *
 * @public
 */
export const stepOuter = createSection(
  'stepOuter',
  () => ({
    $el: 'div',
    attrs: {
      key: '$id',
      'data-type': 'step',
      class: '$classes.step',
      style: {
        if: '$isActiveStep',
        then: '',
        else: 'display: none;',
      },
    },
  }),
  true
)
