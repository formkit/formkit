import { createSection } from '../compose'

/**
 * File name section to show the file name
 *
 * @public
 */
export const fileName = createSection('fileName', () => ({
  $el: 'span',
  attrs: {
    class: '$classes.fileName',
  },
}))
