import { createSection } from '@formkit/inputs'

/**
 * Outer section of the multi-step where most data attributes are assigned.
 *
 * @public
 */
export const multiStepOuter = createSection(
  'multiStepOuter',
  () => ({
    $el: 'div',
    attrs: {
      key: '$id',
      id: '$id',
      class: '$classes.outer',
      'data-family': '$family || undefined',
      'data-type': '$type',
      'data-multiple':
        '$attrs.multiple || ($type != "select" && $options != undefined) || undefined',
      'data-disabled': '$disabled || undefined',
      'data-complete': '$state.complete || undefined',
      'data-invalid':
        '$state.valid === false && $state.validationVisible || undefined',
      'data-errors': '$state.errors || undefined',
      'data-submitted': '$state.submitted || undefined',
    },
  }),
  true
)
