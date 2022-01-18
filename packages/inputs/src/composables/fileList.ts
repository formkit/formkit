import { composable } from '../compose'

const fileList = composable('fileList', () => ({
  $el: 'ul',
  if: '$value.length',
  attrs: {
    class: '$classes.fileList',
    'data-has-multiple': {
      if: '$value.length > 1',
      then: 'true',
    },
  },
}))

export default fileList
