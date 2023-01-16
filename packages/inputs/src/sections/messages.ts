import { createSection } from '../compose'

/**
 * @public
 */
export const messages = createSection('messages', () => ({
  $el: 'ul',
  if: '$defaultMessagePlacement && $fns.length($messages)',
}))
