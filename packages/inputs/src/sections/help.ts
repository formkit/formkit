import { createSection } from '../compose'

/**
 * @public
 */
export const help = createSection('help', () => ({
  $el: 'div',
  if: '$help',
  attrs: {
    id: '$: "help-" + $id',
  },
}))
