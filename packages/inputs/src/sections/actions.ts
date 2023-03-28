import { createSection } from '../createSection'

/**
 * Actions section that shows the action buttons
 *
 * @public
 */
export const actions = createSection('actions', () => ({
  $el: 'div',
  if: '$actions',
}))
