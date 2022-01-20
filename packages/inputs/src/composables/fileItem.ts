import { composable } from '../compose'

const fileItem = composable('fileItem', () => ({
  $el: 'li',
  for: ['file', '$value'],
  attrs: {
    class: '$classes.fileItem',
  },
}))

export default fileItem
