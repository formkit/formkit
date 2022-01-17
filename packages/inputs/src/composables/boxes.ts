import { composable } from '../compose'

const boxes = composable('option', () => ({
  $el: 'li',
  for: ['option', '$options'],
  attrs: {
    class: '$classes.option',
    'data-disabled': '$option.attrs.disabled || $disabled',
  },
}))

export default boxes
