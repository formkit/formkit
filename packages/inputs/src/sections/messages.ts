import { createSection } from '../compose'

export const messages = createSection('messages', () => ({
  $el: 'ul',
  if: '$fns.length($messages)',
}))
