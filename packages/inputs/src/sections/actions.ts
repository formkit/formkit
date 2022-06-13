import { createSection } from '../compose'

export const actions = createSection('actions', () => ({
  $el: 'div',
  if: '$actions',
}))
