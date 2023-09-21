import { createSection } from '../createSection'

/**
 * Fieldset section, used to describe help
 *
 * @public
 * @__NO_SIDE_EFFECTS__
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
