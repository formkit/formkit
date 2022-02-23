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
      '$state.valid === false && ($state.validationVisible || $state.submitted) || undefined',
    'data-errors': '$state.errors || undefined',
  },
}))

export default outer
