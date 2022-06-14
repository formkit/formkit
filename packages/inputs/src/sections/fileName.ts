import { createSection } from '../compose'

export const fileName = createSection('fileName', () => ({
  $el: 'span',
  attrs: {
    class: '$classes.fileName',
  },
}))
