import { composable } from '../compose'

const removeFiles = composable('removeFiles', () => ({
  $el: 'a',
  attrs: {
    href: '#',
    class: '$classes.removeFiles',
    onClick: '$handlers.resetFiles',
  },
}))

export default removeFiles
