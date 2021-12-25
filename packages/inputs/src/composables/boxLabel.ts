import { composable } from '../compose'

const boxLabel = composable('label', () => ({
  $el: 'span',
  if: '$label',
  attrs: {
    class: '$classes.label',
  },
}))

export default boxLabel
