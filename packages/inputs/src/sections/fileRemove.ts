import { createSection } from '../createSection'

/**
 * File remove section to show a remove button for files
 *
 * @public
 */
export const fileRemove = createSection('fileRemove', () => ({
  $el: 'button',
  attrs: {
    type: 'button',
    onClick: '$handlers.resetFiles',
  },
}))
