import { createSection } from '../compose'

/**
 * @public
 */
export const legend = createSection('legend', () => ({
  $el: 'legend',
  if: '$label',
}))
