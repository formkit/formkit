import { createSection } from '@formkit/inputs'

/**
 * Tab section, holds a group of tabs
 *
 * @public
 */
export const tab = createSection('tab', () => ({
  $el: 'li',
  for: ['step', 'index', '$steps'],
  attrs: {
    onClick: '$handlers.setActiveStep($step)',
  },
}))
