import { composable } from '../compose'

const fileListItem = composable('fileListItem', () => ({
  $el: 'span',
  attrs: {
    class: '$classes.fileListItem',
  },
  children: '$file.name',
}))

export default fileListItem
