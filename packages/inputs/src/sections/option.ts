import { createSection } from '../createSection'

/**
 * Option section used to show options
 *
 * @public
 */
export const option = createSection('option', () => ({
  $el: 'option',
  bind: '$option.attrs',
  attrs: {
    class: '$classes.option',
    value: '$option.value',
    selected: '$fns.isSelected($option)',
  },
}))
