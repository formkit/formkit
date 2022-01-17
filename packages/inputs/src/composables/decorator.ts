import { composable } from '../compose'

const decorator = composable('decorator', () => ({
  $el: 'span',
  attrs: {
    class: '$classes.decorator',
    'aria-hidden': 'true',
  },
}))

export default decorator
