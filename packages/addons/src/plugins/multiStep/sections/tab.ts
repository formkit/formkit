import { createSection } from '@formkit/inputs'

/**
 * Tab section, holds a group of tabs
 *
 * @public
 */
export const tab = createSection('tab', () => ({
  $el: 'button',
  for: ['step', 'index', '$steps'],
  attrs: {
    onClick: '$handlers.setActiveStep($step)',
    'data-active': '$step.isActiveStep',
    'data-valid': '$step.isValid',
    'data-visited': '$step.hasBeenVisited',
    role: 'button',
    'aria-pressed': '$step.isActiveStep || false',
  },
}))
