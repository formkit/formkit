import { createSection } from '../compose'

/**
 * File list section to show all file names
 *
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
