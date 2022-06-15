import { createSection } from '../compose'

/**
 * @public
 */
export const boxHelp = createSection('optionHelp', () => ({
  $el: 'div',
  if: '$option.help',
  attrs: {
    id: '$: "help-" + $option.attrs.id',
  },
}))
