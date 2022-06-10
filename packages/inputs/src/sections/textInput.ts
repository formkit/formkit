import { textAttrs } from '../attrs'
import { createSection } from '../compose'

export const textInput = createSection('input', () => ({
  $el: 'input',
  bind: '$attrs',
  attrs: textAttrs(),
}))
