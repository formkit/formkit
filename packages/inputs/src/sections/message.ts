import { createSection } from '../compose'

/**
 * Message section, shows a group of messages.
 *
 * @public
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
