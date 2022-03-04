import { composable } from '../compose'

const form = composable('form', () => ({
  $el: 'form',
  bind: '$attrs',
  attrs: {
    id: '$id',
    class: '$classes.form',
    name: '$node.name',
    onSubmit: '$handlers.submit',
    'data-loading': '$state.loading || undefined',
  },
}))

export default form
