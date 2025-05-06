import { createSection } from '@formkit/inputs'

/**
 * Wrapper section, wraps the entire multi-step form
 *
 * @public
 */
export const wrapper = createSection('wrapper', () => ({
  $el: 'div',
  attrs: {
    'data-tab-style': '$tabStyle',
    'data-hide-labels': '$hideProgressLabels',
  },
}))
