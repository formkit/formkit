import { createSection } from '../createSection'

/**
 * Input section used by textarea inputs
 *
 * @public
 */
export const textareaInput = createSection('input', () => ({
  $el: 'textarea',
  bind: '$attrs',
  attrs: {
    disabled: '$disabled',
    name: '$node.name',
    onInput: '$handlers.DOMInput',
    onBlur: '$handlers.blur',
    value: '$_value',
    id: '$id',
    'aria-describedby': '$describedBy',
    'aria-required': '$state.required || undefined',
  },
  children: '$initialValue',
}))
