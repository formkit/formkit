import { createSection } from '../createSection'

/**
 * Label section with label element
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const label = createSection('label', () => ({
  $el: 'label',
  if: '$label',
  attrs: {
    for: '$id',
  },
}))
