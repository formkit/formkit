import { composable } from '../compose'

const button = composable('input', () => ({
  $el: 'button',
  bind: '$attrs',
  attrs: {
    type: '$type',
    disabled: '$disabled',
    class: '$classes.input',
    name: '$node.name',
    id: '$id',
  },
}))

export default button
