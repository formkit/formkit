import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value contain symbol.
 * @param context - The FormKitValidationContext
 * @public
 */
const contains_symbol: FormKitValidationRule = function ({ value }) {
  return /[!-/:-@[-`{-~]/.test(String(value))
}

export default contains_symbol
