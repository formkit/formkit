import { composable } from '../compose'

const label = composable('label', () => ({
  $el: 'label',
  if: '$label',
  attrs: {
    for: '$id',
    class: '$classes.label',
  },
}))
export default label
