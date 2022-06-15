import { createSection } from '../compose'

export const submitInput = createSection('submit', () => ({
  $cmp: 'FormKit',
  bind: '$submitAttrs',
  props: {
    ignore: true,
    type: 'submit',
    disabled: '$disabled',
    label: '$submitLabel',
  },
}))
