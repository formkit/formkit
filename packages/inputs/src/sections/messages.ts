import { createSection } from '../compose'

/**
 * Messages section where all messages will be displayed.
 *
 * @public
 */
export const messages = createSection('messages', () => ({
  $el: 'ul',
  if: '$fns.length($messages)',
}))
