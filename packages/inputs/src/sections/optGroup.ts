import { createSection } from '../createSection'

/**
 * Option section used to show options
 *
 * @public
 */
export const optGroup = createSection('optGroup', () => ({
  $el: 'optgroup',
  bind: '$option.attrs',
  attrs: {
    label: '$option.group',
  },
}))
