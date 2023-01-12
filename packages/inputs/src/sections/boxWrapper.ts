import { createSection } from '../compose'

/**
 * Wrapper section for options
 *
 * @public
 */
export const boxWrapper = createSection('wrapper', () => ({
  $el: 'label',
  attrs: {
    'data-disabled': {
      if: '$options.length',
      then: undefined,
      else: '$disabled || undefined',
    },
  },
}))
