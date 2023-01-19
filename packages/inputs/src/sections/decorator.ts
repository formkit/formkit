import { createSection } from '../compose'

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
