import { createSection } from '../compose'

/**
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
