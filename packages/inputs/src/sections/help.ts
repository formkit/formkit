import { createSection } from '../createSection'

/**
 * Help section that shows help text
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const help = createSection('help', () => ({
  $el: 'div',
  if: '$help',
  attrs: {
    id: '$: "help-" + $id',
  },
}))
