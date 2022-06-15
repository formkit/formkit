import { createSection } from '../compose'

/**
 * @public
 */
export const messages = createSection('messages', () => ({
  $el: 'ul',
  if: '$fns.length($messages)',
}))
