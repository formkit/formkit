import { createSection } from '../compose'

export const submit = createSection('submit', () => ({
  $cmp: 'FormKit',
  bind: '$submitAttrs',
  props: {
    ignore: true,
    type: 'submit',
    disabled: '$disabled',
    label: '$submitLabel',
  },
}))
