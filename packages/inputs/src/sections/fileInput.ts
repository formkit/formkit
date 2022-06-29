import { createSection } from '../compose'

/**
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
