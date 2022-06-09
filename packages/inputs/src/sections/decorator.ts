import { createSection } from '../compose'

export default createSection('label', () => ({
  $el: 'span',
  attrs: {
    'aria-hidden': 'true',
  },
}))
