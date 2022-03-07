import { composable } from '../compose'

const messages = composable('messages', () => ({
  $el: 'ul',
  if: '$fns.length($messages)',
  attrs: {
    class: '$classes.messages',
    'aria-live': '$type === "form" && "assertive" || "polite"',
  },
}))

export default messages
