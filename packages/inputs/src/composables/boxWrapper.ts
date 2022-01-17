import { composable } from '../compose'

const wrapper = composable('wrapper', () => ({
  $el: 'label',
  attrs: {
    class: '$classes.wrapper',
    'data-disabled': {
      if: '$options.length',
      then: undefined,
      else: '$disabled',
    },
  },
}))

export default wrapper
