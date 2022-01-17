import { composable } from '../compose'

const form = composable('form', () => ({
  $el: 'form',
  bind: '$attrs',
  attrs: {
    class: '$classes.form',
    name: '$node.name',
    onSubmit: '$handlers.submit',
  },
}))

export default form
