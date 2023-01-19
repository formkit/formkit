import { createSection } from '../compose'

/**
 * Option help section
 *
 * @public
 */
export const boxHelp = createSection('optionHelp', () => ({
  $el: 'div',
  if: '$option.help',
  attrs: {
    id: '$: "help-" + $option.attrs.id',
  },
}))
