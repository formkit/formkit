import { createSection } from '@formkit/inputs'

/**
 * Steps section, wraps all the steps of a multi-step form
 *
 * @public
 */
export const steps = createSection('steps', () => ({
  $el: 'div',
}))
