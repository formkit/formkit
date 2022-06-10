import { createSection } from '../compose'

export const decorator = createSection('decorator', () => ({
  $el: 'span',
  attrs: {
    'aria-hidden': 'true',
  },
}))
