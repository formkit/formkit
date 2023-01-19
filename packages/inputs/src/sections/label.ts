import { createSection } from '../compose'

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
