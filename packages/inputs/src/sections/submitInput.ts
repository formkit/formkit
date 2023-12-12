import { createSection } from '../createSection'

/**
 * Submit section that displays a submit button from a form
 *
 * @public
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
