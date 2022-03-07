import { composable } from '../compose'

const outer = composable('outer', () => ({
  $el: 'div',
  attrs: {
    class: '$classes.outer',
    'data-type': '$type',
    'data-multiple': '$attrs.multiple',
    'data-disabled': '$disabled || undefined',
    'data-complete': '$state.complete || undefined',
    'data-invalid':
      '$state.valid === false && $state.validationVisible || undefined',
    'data-errors': '$state.errors || undefined',
    'data-submitted': '$state.submitted || undefined',
  },
}))

export default outer
