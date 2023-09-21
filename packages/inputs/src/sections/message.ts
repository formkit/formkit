import { createSection } from '../createSection'

/**
 * Message section, shows a group of messages.
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const message = createSection('message', () => ({
  $el: 'li',
  for: ['message', '$messages'],
  attrs: {
    key: '$message.key',
    id: `$id + '-' + $message.key`,
    'data-message-type': '$message.type',
  },
}))
