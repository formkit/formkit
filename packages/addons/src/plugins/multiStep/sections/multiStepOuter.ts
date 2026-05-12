import { createSection } from '@formkit/inputs'

/**
 * Outer section of the multi-step where most data attributes are assigned.
 *
 * @public
 */
export const multiStepOuter = createSection('multiStepOuter', () => ({
  $el: 'div',
  attrs: {
    key: '$id',
    id: '$id',
    class: '$classes.outer',
    'data-prerender': '$fns.preRenderSteps()',
    'data-family': '$family || undefined',
    'data-type': '$type',
    'data-multiple':
      '$attrs.multiple || ($type != "select" && $options != undefined) || undefined',
    'data-disabled': '$disabled || undefined',
    'data-submitted': '$state.submitted || undefined',
  },
}))
