import { createSection } from '../createSection'

/**
 * Options slot section that displays options when used with slots
 *
 * @public
 */
export const optionSlot = createSection('options', () => ({
  $el: null,
  if: '$options.length',
  for: ['option', '$option.options || $options'],
}))
