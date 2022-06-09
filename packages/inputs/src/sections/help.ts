import { createSection } from '../compose'

export default createSection('help', () => ({
  $el: 'div',
  if: '$help',
  attrs: {
    id: '$: "help-" + $id',
  },
}))
