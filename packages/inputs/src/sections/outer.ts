import { createSection } from '../createSection'

/**
 * Outer section where most data attributes are assigned.
 *
 * @public
 */
export const outer = createSection('outer', () => ({
  $el: 'div',
  attrs: {
    key: '$id',
    'data-family': '$family || undefined',
    'data-type': '$type',
    'data-multiple':
      '$attrs.multiple || ($type != "select" && $options != undefined) || undefined',
    'data-has-multiple': '$_hasMultipleFiles',
    'data-disabled': '$: ($disabled !== "false" && $disabled) || undefined',
    'data-empty': '$state.empty || undefined',
    'data-complete': '$state.complete || undefined',
    'data-invalid':
      '$state.valid === false && $state.validationVisible || undefined',
    'data-errors': '$state.errors || undefined',
    'data-submitted': '$state.submitted || undefined',
    'data-prefix-icon': '$_rawPrefixIcon !== undefined || undefined',
    'data-suffix-icon': '$_rawSuffixIcon !== undefined || undefined',
    'data-prefix-icon-click': '$onPrefixIconClick !== undefined || undefined',
    'data-suffix-icon-click': '$onSuffixIconClick !== undefined || undefined',
  },
}))
