import { has } from '@formkit/utils'
import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is only alpha or numeric characters.
 * @param context - The FormKitValidationContext
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
  return sets[selectedSet].test(value)
}

export default alphanumeric
