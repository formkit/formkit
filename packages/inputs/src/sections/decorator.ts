import { createSection } from '../createSection'

/**
 * Decorator section
 *
 * @public
 */
export const decorator = createSection('decorator', () => ({
  $el: 'span',
  attrs: {
    'aria-hidden': 'true',
  },
}))
