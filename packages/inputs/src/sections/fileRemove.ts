import { createSection } from '../compose'

export const fileRemove = createSection('fileRemove', () => ({
  $el: 'button',
  attrs: {
    onClick: '$handlers.resetFiles',
  },
}))
