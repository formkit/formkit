import { composable } from '../compose'

const fileName = composable('fileName', () => ({
  $el: 'span',
  attrs: {
    class: '$classes.fileName',
  },
}))

export default fileName
