import { createSection } from '../createSection'

/**
 * Input section for a file input
 *
 * @public
 */
export const fileInput = createSection('input', () => ({
  $el: 'input',
  bind: '$attrs',
  attrs: {
    type: 'file',
    disabled: '$disabled',
    name: '$node.name',
    onChange: '$handlers.files',
    onBlur: '$handlers.blur',
    id: '$id',
    'aria-describedby': '$describedBy',
  },
}))
