import { composable } from '../compose'

const fileItem = composable('fileItem', () => ({
  $el: 'li',
  for: ['file', '$files'],
  attrs: {
    class: '$classes.fileItem',
  },
}))

export default fileItem
