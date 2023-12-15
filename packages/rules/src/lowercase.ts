import { has } from '@formkit/utils'
import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value contains only lowercase characters.
 * @param context - The FormKitValidationContext
 * @public
 */
const lowercase: FormKitValidationRule = function ({ value }, set = 'default') {
  const sets = {
    default: /^\p{Ll}+$/u,
    allow_non_alpha: /^[0-9\p{Ll}!-/:-@[-`{-~]+$/u,
    allow_numeric: /^[0-9\p{Ll}]+$/u,
    latin: /^[a-z]+$/,
  }
  const selectedSet: 'default' | 'allow_non_alpha' | 'allow_numeric' | 'latin' = has(sets, set) ? set : 'default'
  return sets[selectedSet].test(String(value))
}

export default lowercase
