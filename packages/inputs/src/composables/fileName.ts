import { composable } from '../compose'

const fileName = composable('fileName', () => ({
  $el: 'span',
  attrs: {
    class: '$classes.fileName',
  },
  children: '$file.name',
}))

export default fileName
