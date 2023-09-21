import { createSection } from '../createSection'

/**
 * Actions section that shows the action buttons
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const actions = createSection('actions', () => ({
  $el: 'div',
  if: '$actions',
}))
