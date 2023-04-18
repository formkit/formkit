import { createSection } from '../createSection'

/**
 * Option section used to show an option
 *
 * @public
 */
export const boxOption = createSection('option', () => ({
  $el: 'li',
  for: ['option', '$options'],
  attrs: {
    'data-disabled': '$option.attrs.disabled || $disabled',
  },
}))
