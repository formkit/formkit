import { createSection } from '../compose'

/**
 * @public
 */
export const actions = createSection('actions', () => ({
  $el: 'div',
  if: '$actions',
}))
