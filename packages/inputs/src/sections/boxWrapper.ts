import { createSection } from '../createSection'

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
    'data-checked': {
      if: '$options == undefined',
      then: '$fns.eq($_value, $onValue) || undefined',
      else: '$fns.isChecked($option.value) || undefined',
    },
  },
}))
