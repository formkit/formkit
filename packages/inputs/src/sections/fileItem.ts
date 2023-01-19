import { createSection } from '../compose'

/**
 * File item section for showing a file name
 *
 * @public
 */
export const fileItem = createSection('fileItem', () => ({
  $el: 'li',
  for: ['file', '$value'],
}))
