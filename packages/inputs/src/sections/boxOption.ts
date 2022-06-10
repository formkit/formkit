import { createSection } from '../compose'

export const boxOption = createSection('option', () => ({
  $el: 'li',
  for: ['option', '$options'],
  attrs: {
    'data-disabled': '$option.attrs.disabled || $disabled',
  },
}))
