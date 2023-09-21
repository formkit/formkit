import { createSection } from '../createSection'

/**
 * Submit section that displays a submit button from a form
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const submitInput = createSection('submit', () => ({
  $cmp: 'FormKit',
  bind: '$submitAttrs',
  props: {
    type: 'submit',
    disabled: '$disabled',
    label: '$submitLabel',
  },
}))
