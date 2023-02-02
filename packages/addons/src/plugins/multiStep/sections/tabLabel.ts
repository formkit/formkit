import { createSection } from '@formkit/inputs'

/**
 * the label for a tab in a multi-step input
 *
 * @public
 */
export const tabLabel = createSection('tabLabel', () => ({
  $el: 'span',
}))
