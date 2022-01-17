import { composable } from '../compose'

const message = composable('message', () => ({
  $el: 'li',
  for: ['message', '$messages'],
  attrs: {
    class: '$classes.message',
  },
}))

export default message
