import { createSection } from '../compose'

/**
 * @public
 */
export const option = createSection('option', () => ({
  $el: 'option',
  for: ['option', '$options'],
  bind: '$option.attrs',
  attrs: {
    class: '$classes.option',
    value: '$option.value',
    selected: '$fns.isSelected($option.value)',
  },
}))
