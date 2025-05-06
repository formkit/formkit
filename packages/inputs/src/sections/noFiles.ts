import { createSection } from '../createSection'

/**
 * No file section that shows when there is no files
 *
 * @public
 */
export const noFiles = createSection('noFiles', () => ({
  $el: 'span',
  if: '$value == null || $value.length == 0',
}))
