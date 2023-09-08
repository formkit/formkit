import { createSection } from '../createSection'

/**
 * Legend section, used instead of label when its grouping fields.
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const legend = createSection('legend', () => ({
  $el: 'legend',
  if: '$label',
}))
