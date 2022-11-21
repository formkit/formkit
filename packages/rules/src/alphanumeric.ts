import { has } from '@formkit/utils'
import type { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is only alpha or numeric characters.
 * @param context - The FormKitValidationContext
 * @public
 */
const alphanumeric: FormKitValidationRule = function (
  { value },
  set = 'default'
) {
  const sets = {
    default: /^[a-zA-Z0-9À-ÖØ-öø-ÿĄąĆćĘęŁłŃńŚśŹźŻż]+$/,
    latin: /^[a-zA-Z0-9]+$/,
  }
  const selectedSet: 'default' | 'latin' = has(sets, set) ? set : 'default'
  return sets[selectedSet].test(String(value))
}

export default alphanumeric
