import { composable } from '../compose'

const outer = composable('outer', () => ({
  $el: 'div',
  attrs: {
    class: '$classes.outer',
    'data-type': '$type',
    'data-multiple': '$attrs.multiple',
    'data-disabled': '$disabled || undefined',
  },
}))

export default outer
