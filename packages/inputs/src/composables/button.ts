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
  children: {
    if: '$slots.default',
    then: '$slots.default',
    else: {
      if: '$label',
      then: '$label',
      else: '$ui.submit.value',
    },
  },
}))

export default button
