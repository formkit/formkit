import { composable } from '../compose'

const textarea = composable('input', () => ({
  $el: 'textarea',
  bind: '$attrs',
  attrs: {
    class: '$classes.input',
    disabled: '$disabled',
    name: '$node.name',
    onInput: '$handlers.DOMInput',
    onBlur: '$handlers.blur',
    value: '$_value',
    id: '$id',
  },
}))

export default textarea
