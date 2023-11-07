import { createSection } from '../createSection'

/**
 * File list section to show all file names
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const fileList = createSection('fileList', () => ({
  $el: 'ul',
  if: '$value.length',
  attrs: {
    'data-has-multiple': '$_dataHasMultiple',
  },
}))
