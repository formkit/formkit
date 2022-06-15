import { createSection } from '../compose'

/**
 * @public
 */
export const formInput = createSection(
  'form',
  () => ({
    $el: 'form',
    bind: '$attrs',
    attrs: {
      id: '$id',
      name: '$node.name',
      onSubmit: '$handlers.submit',
      'data-loading': '$state.loading || undefined',
    },
  }),
  true
)
