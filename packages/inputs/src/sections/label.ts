import { createSection } from '../compose'

/**
 * @public
 */
export const label = createSection('label', () => ({
  $el: 'label',
  if: '$label',
  attrs: {
    for: '$id',
  },
}))
