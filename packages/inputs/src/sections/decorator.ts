import { createSection } from '../createSection'

/**
 * Decorator section
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const decorator = createSection('decorator', () => ({
  $el: 'span',
  attrs: {
    'aria-hidden': 'true',
  },
}))
