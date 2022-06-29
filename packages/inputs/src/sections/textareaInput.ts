import { createSection } from '../compose'

/**
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
  },
  children: '$initialValue',
}))
