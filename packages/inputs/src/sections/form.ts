import { createSection } from '../compose'

export const form = createSection(
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
