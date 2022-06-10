import { createSection } from '../compose'

export const boxHelp = createSection('optionHelp', () => ({
  $el: 'div',
  if: '$option.attrs.help',
  attrs: {
    id: '$: "help-" + $option.attrs.id',
  },
}))
