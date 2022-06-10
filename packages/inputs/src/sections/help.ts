import { createSection } from '../compose'

export const help = createSection('help', () => ({
  $el: 'div',
  if: '$help',
  attrs: {
    id: '$: "help-" + $id',
  },
}))
