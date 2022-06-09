import { createSection } from '../compose'

export default createSection('option', () => ({
  $el: 'li',
  for: ['option', '$options'],
  attrs: {
    'data-disabled': '$option.attrs.disabled || $disabled',
  },
}))
