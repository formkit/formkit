import { createSection } from '../createSection'

/**
 * Option help section
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const boxHelp = createSection('optionHelp', () => ({
  $el: 'div',
  if: '$option.help',
  attrs: {
    id: '$: "help-" + $option.attrs.id',
  },
}))
