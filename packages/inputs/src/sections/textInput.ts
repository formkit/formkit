import { createSection } from '../createSection'

/**
 * Input section
 *
 * @public
 */
export const textInput = createSection('input', () => ({
  $el: 'input',
  bind: '$attrs',
  attrs: {
    type: '$type',
    disabled: '$disabled',
    name: '$node.name',
    onInput: '$handlers.DOMInput',
    onBlur: '$handlers.blur',
    value: '$_value',
    id: '$id',
    'aria-describedby': '$describedBy',
  },
}))
