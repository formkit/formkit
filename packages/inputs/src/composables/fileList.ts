import { composable } from '../compose'

const fileList = composable('fileList', () => ({
  $el: 'ul',
  if: '$files.length',
  attrs: {
    class: '$classes.fileList',
  },
}))

export default fileList
