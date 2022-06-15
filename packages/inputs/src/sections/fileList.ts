import { createSection } from '../compose'

/**
 * @public
 */
export const fileList = createSection('fileList', () => ({
  $el: 'ul',
  if: '$value.length',
  attrs: {
    'data-has-multiple': {
      if: '$value.length > 1',
      then: 'true',
    },
  },
}))
