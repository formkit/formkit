import { createSection } from '../compose'

/**
 * @public
 */
export const fileItem = createSection('fileItem', () => ({
  $el: 'li',
  for: ['file', '$value'],
}))
