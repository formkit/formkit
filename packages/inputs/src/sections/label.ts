import { createSection } from '../createSection'

/**
 * Label section with label element
 *
 * @public
 */
export const label = createSection('label', () => ({
  $el: 'label',
  if: '$label',
  attrs: {
    for: '$id',
  },
}))
