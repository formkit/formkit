import { createSection } from '../createSection'

/**
 * File item section for showing a file name
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const fileItem = createSection('fileItem', () => ({
  $el: 'li',
  for: ['file', '$value'],
}))
