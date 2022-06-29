import { createSection } from '../compose'

/**
 * @public
 */
export const fileName = createSection('fileName', () => ({
  $el: 'span',
  attrs: {
    class: '$classes.fileName',
  },
}))
