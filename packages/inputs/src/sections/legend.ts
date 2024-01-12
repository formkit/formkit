import { createSection } from '../createSection'

/**
 * Legend section, used instead of label when its grouping fields.
 *
 * @public
 */
export const legend = createSection('legend', () => ({
  $el: 'legend',
  if: '$label',
}))
