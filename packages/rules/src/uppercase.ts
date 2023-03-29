import { has } from '@formkit/utils'
import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is only alpha characters.
 * @param context - The FormKitValidationContext
 * @public
 */
const uppercase: FormKitValidationRule = function ({ value }, set = 'default') {
  const sets = {
    default: /^[\p{Lu}]+$/u,
    latin: /^[A-Z]+$/,
  }
  const selectedSet: 'default' | 'latin' = has(sets, set) ? set : 'default'
  return sets[selectedSet].test(String(value))
}

export default uppercase
