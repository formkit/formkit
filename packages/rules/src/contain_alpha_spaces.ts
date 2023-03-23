import { has } from '@formkit/utils'
import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value contain alpha characters or space.
 * @param context - The FormKitValidationContext
 * @public
 */
const alpha_spaces: FormKitValidationRule = function (
  { value },
  set = 'default'
) {
  const sets = {
    default: /[\p{Lu}\p{L} ]/u,
    latin: /[a-zA-Z ]/,
  }
  const selectedSet: 'default' | 'latin' = has(sets, set) ? set : 'default'
  return sets[selectedSet].test(String(value))
}

export default alpha_spaces
