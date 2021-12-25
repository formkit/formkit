import { composable } from '../compose'

const actions = composable('actions', () => ({
  $el: 'div',
  if: '$actions',
  attrs: {
    class: '$classes.actions',
  },
}))
export default actions
