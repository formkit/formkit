import { createSection } from '../compose'

/**
 * @public
 */
export const fileRemove = createSection('fileRemove', () => ({
  $el: 'button',
  attrs: {
    onClick: '$handlers.resetFiles',
  },
}))
