import { createSection } from '@formkit/inputs'

/**
 * Contains the "next" action element for a multi-step step.
 *
 * @public
 */
export const badge = createSection('badge', () => ({
  $el: 'span',
}))
