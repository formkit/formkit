import { createSection } from '../compose'

/**
 * File remove section to show a remove button for files
 *
 * @public
 */
export const fileRemove = createSection('fileRemove', () => ({
  $el: 'button',
  attrs: {
    onClick: '$handlers.resetFiles',
  },
}))
