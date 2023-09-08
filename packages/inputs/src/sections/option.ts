import { createSection } from '../createSection'

/**
 * Option section used to show options
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const option = createSection('option', () => ({
  $el: 'option',
  for: ['option', '$options'],
  bind: '$option.attrs',
  attrs: {
    class: '$classes.option',
    value: '$option.value',
    selected: '$fns.isSelected($option)',
  },
}))
