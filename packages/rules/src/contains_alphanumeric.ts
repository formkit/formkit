import { has } from '@formkit/utils'
import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value contains alpha or numeric characters.
 * @param context - The FormKitValidationContext
 * @public
 */
const contains_alphanumeric: FormKitValidationRule = function (
  { value },
  set = 'default'
) {
  const sets = {
    default: /[0-9\p{L}]/u,
    latin: /[0-9a-z]/i,
  }
  const selectedSet: 'default' | 'latin' = has(sets, set) ? set : 'default'
  return sets[selectedSet].test(String(value))
}

export default contains_alphanumeric
