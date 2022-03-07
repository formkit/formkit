import { composable } from '../compose'

const message = composable('message', () => ({
  $el: 'li',
  for: ['message', '$messages'],
  attrs: {
    key: '$message.key',
    class: '$classes.message',
    id: `$id + '-' + $message.key`,
    'data-message-type': '$message.type',
  },
}))

export default message
