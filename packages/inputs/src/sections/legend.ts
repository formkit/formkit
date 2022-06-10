import { createSection } from '../compose'

export const legend = createSection('legend', () => ({
  $el: 'legend',
  if: '$label',
}))
