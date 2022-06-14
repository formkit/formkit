import { createSection } from '../compose'

export const noFiles = createSection('noFiles', () => ({
  $el: 'span',
  if: '$value.length == 0',
}))
