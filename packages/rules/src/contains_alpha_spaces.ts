import { has } from '@formkit/utils'
import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value contains alpha characters or space.
 * @param context - The FormKitValidationContext
 * @public
 */
const contains_alpha_spaces: FormKitValidationRule = function (
  { value },
  set = 'default'
) {
  const sets = {
    default: /[\p{L} ]/u,
    latin: /[a-z ]/i,
  }
  const selectedSet: 'default' | 'latin' = has(sets, set) ? set : 'default'
  return sets[selectedSet].test(String(value))
}

export default contains_alpha_spaces
