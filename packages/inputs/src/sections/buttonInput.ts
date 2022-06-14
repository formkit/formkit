import { createSection } from '../compose'

export const buttonInput = createSection('input', () => ({
  $el: 'button',
  bind: '$attrs',
  attrs: {
    type: '$type',
    disabled: '$disabled',
    name: '$node.name',
    id: '$id',
  },
}))
