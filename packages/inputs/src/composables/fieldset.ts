import { composable } from '../compose'

const fieldset = composable('fieldset', () => ({
  $el: 'fieldset',
  attrs: {
    id: '$id',
    class: '$classes.fieldset',
    'aria-describedby': {
      if: '$help',
      then: '$: "help-" + $id',
      else: undefined,
    },
  },
}))

export default fieldset
