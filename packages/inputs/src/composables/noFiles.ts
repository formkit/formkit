import { composable } from '../compose'

const noFiles = composable('noFiles', () => ({
  $el: 'span',
  if: '$files.length == 0',
  attrs: {
    class: '$classes.noFiles',
  },
}))

export default noFiles
