import { createSection } from '../compose'

export default createSection('optionHelp', () => ({
  $el: 'div',
  if: '$option.attrs.help',
  attrs: {
    id: '$: "help-" + $option.attrs.id',
  },
}))
