import { composable } from '../compose'

const wrapper = composable('options', () => ({
  $el: 'ul',
  attrs: {
    class: '$classes.options',
  },
}))

export default wrapper
