import { composable } from '../compose'

const submit = composable('submit', () => ({
  $cmp: 'FormKit',
  bind: '$submitAttrs',
  props: {
    ignore: true,
    type: 'submit',
    'data-loading': '$state.loading',
    disabled: '$disabled',
    label: '$submitLabel',
  },
}))
export default submit
