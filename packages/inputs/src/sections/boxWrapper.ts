import { createSection } from '../compose'

export const boxWrapper = createSection('wrapper', () => ({
  $el: 'label',
  attrs: {
    'data-disabled': {
      if: '$options.length',
      then: undefined,
      else: '$disabled',
    },
  },
}))
