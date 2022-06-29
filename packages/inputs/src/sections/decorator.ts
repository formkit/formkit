import { createSection } from '../compose'

/**
 * @public
 */
export const decorator = createSection('decorator', () => ({
  $el: 'span',
  attrs: {
    'aria-hidden': 'true',
  },
}))
