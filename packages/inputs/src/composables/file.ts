import { composable } from '../compose'

const file = composable('input', () => ({
  $el: 'input',
  bind: '$attrs',
  attrs: {
    type: 'file',
    disabled: '$disabled',
    class: '$classes.input',
    name: '$node.name',
    onChange: '$handlers.files',
    onBlur: '$handlers.blur',
    id: '$id',
    'aria-describedby': '$describedBy',
  },
}))

export default file
