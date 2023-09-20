import { createSection } from '../createSection'

/**
 * File name section to show the file name
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const fileName = createSection('fileName', () => ({
  $el: 'span',
  attrs: {
    class: '$classes.fileName',
  },
}))
