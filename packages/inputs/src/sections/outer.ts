import { createSection } from '../compose'

export const outer = createSection(
  'outer',
  () => ({
    $el: 'div',
    attrs: {
      key: '$id',
      'data-type': '$type',
      'data-multiple': '$attrs.multiple',
      'data-disabled': '$disabled || undefined',
      'data-complete': '$state.complete || undefined',
      'data-invalid':
        '$state.valid === false && $state.validationVisible || undefined',
      'data-errors': '$state.errors || undefined',
      'data-submitted': '$state.submitted || undefined',
      'data-has-prefix-icon': '$_rawPrefixIcon !== undefined || undefined',
      'data-has-suffix-icon': '$_rawSuffixIcon !== undefined || undefined'
    },
  }),
  true
)
