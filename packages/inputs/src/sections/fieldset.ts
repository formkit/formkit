import { createSection } from '../compose'

/**
 * @public
 */
export const fieldset = createSection('fieldset', () => ({
  $el: 'fieldset',
  attrs: {
    id: '$id',
    'aria-describedby': {
      if: '$help',
      then: '$: "help-" + $id',
      else: undefined,
    },
  },
}))
