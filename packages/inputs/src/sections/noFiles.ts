import { createSection } from '../compose'

/**
 * @public
 */
export const noFiles = createSection('noFiles', () => ({
  $el: 'span',
  if: '$value.length == 0',
}))
