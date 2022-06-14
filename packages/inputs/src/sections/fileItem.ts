import { createSection } from '../compose'

export const fileItem = createSection('fileItem', () => ({
  $el: 'li',
  for: ['file', '$value'],
}))
