import { createSection } from '@formkit/inputs'

/**
 * Outer section of a multi-step step. Has conditinal styling
 * depending on if it's the $activeStep.
 *
 * @public
 */
export const stepOuter = createSection('stepOuter', () => ({
  $el: 'div',
  attrs: {
    key: '$id',
    'data-type': 'step',
    'data-disabled': '$disabled || undefined',
    'data-invalid':
      '$state.valid === false && $state.validationVisible || undefined',
    'data-errors': '$state.errors || undefined',
    'data-submitted': '$state.submitted || undefined',
    id: '$id',
    role: 'tabpanel',
    'aria-labelledby': '$node.parent.props.id + "_tab_" + $stepIndex',
    class: '$classes.step',
    hidden: '$isActiveStep === false || undefined',
  },
}))
