import { createSection } from '../createSection'

/**
 * Messages section where all messages will be displayed.
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const messages = createSection('messages', () => ({
  $el: 'ul',
  if: '$defaultMessagePlacement && $fns.length($messages)',
}))
