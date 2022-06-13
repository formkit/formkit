import { createSection } from '../compose'

export const selectInput = createSection('input', () => ({
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
}))
