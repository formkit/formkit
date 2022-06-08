import { createSection } from '../compose'

export default createSection('messages', () => ({
  $el: 'ul',
  if: '$fns.length($messages)',
}))
