import { composable } from '../compose'

const text = composable('input', () => ({
  $el: 'input',
  bind: '$attrs',
  attrs: {
    type: '$type',
    disabled: '$disabled',
    class: '$classes.input',
    name: '$node.name',
    onInput: '$handlers.DOMInput',
    onBlur: '$handlers.blur',
    value: '$_value',
    id: '$id',
    'aria-describedby': '$describedBy',
  },
}))

export default text
