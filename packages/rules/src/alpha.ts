import { has } from '@formkit/utils'
import type { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value contains only alpha characters.
 * @param context - The FormKitValidationContext
 * @public
 */
const alpha: FormKitValidationRule = function ({ value }, set = 'default') {
  const sets = {
    default: /^\p{L}+$/u,
    latin: /^[a-z]+$/i,
  }
  const selectedSet: 'default' | 'latin' = has(sets, set) ? set : 'default'
  return sets[selectedSet].test(String(value))
}

export default alpha
