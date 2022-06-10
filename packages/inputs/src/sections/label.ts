import { createSection } from '../compose'

export const label = createSection('label', () => ({
  $el: 'label',
  if: '$label',
  attrs: {
    for: '$id',
  },
}))
