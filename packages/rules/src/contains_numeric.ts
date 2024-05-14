import type { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value contains numeric characters.
 * @param context - The FormKitValidationContext
 * @public
 */
const contains_numeric: FormKitValidationRule = function number({ value }) {
  return /[0-9]/.test(String(value))
}

export default contains_numeric
