import { composable } from '../compose'

const inner = composable('inner', () => ({
  $el: 'div',
  attrs: {
    class: '$classes.inner',
  },
}))

export default inner
