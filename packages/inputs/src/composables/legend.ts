import { composable } from '../compose'

const legend = composable('legend', () => ({
  $el: 'legend',
  attrs: {
    class: '$classes.legend',
  },
}))

export default legend
