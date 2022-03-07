import { composable } from '../compose'

const select = composable('input', (children) => ({
  $el: 'select',
  bind: '$attrs',
  attrs: {
    id: '$id',
    'data-placeholder': {
      if: '$placeholder',
      then: {
        if: '$value',
        then: undefined,
        else: 'true',
      },
    },
    disabled: '$disabled',
    class: '$classes.input',
    name: '$node.name',
    onInput: '$handlers.selectInput',
    onBlur: '$handlers.blur',
    'aria-describedby': '$describedBy',
  },
  children: {
    if: '$slots.default',
    then: '$slots.default',
    else: children,
  },
}))

export default select
