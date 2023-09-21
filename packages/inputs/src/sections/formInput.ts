import { createSection } from '../createSection'

/**
 * Form section
 *
 * @public
 * @__NO_SIDE_EFFECTS__
 */
export const formInput = createSection('form', () => ({
  $el: 'form',
  bind: '$attrs',
  attrs: {
    id: '$id',
    name: '$node.name',
    onSubmit: '$handlers.submit',
    'data-loading': '$state.loading || undefined',
  },
}))
