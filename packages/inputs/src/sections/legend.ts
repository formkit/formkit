import { createSection } from '../compose'

export default createSection('legend', () => ({
  $el: 'legend',
  if: '$label',
}))
