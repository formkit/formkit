import { composable } from '../compose'

const boxLabel = composable('label', (children) => ({
  $el: 'span',
  if: typeof children === 'string' ? children : '$: true',
  attrs: {
    class: '$classes.label',
  },
}))

export default boxLabel
