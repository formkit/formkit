import type { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value contains only symbol characters.
 * @param context - The FormKitValidationContext
 * @public
 */
const symbol: FormKitValidationRule = function ({ value }) {
  return /^[!-/:-@[-`{-~]+$/.test(String(value))
}

export default symbol
