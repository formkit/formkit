import { textAttrs } from '../attrs'
import { createSection } from '../compose'

export default createSection('input', () => ({
  $el: 'input',
  bind: '$attrs',
  attrs: textAttrs(),
}))
