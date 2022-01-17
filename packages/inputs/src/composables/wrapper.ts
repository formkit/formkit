import { composable } from '../compose'

const wrapper = composable('wrapper', () => ({
  $el: 'div',
  attrs: {
    class: '$classes.wrapper',
  },
}))

export default wrapper
