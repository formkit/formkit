import { composable } from '../compose'

const legend = composable('legend', () => ({
  $el: 'legend',
  if: '$label',
  attrs: {
    class: '$classes.legend',
  },
}))

export default legend
