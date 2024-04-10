import type { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is numeric.
 * @param context - The FormKitValidationContext
 * @public
 */
const number: FormKitValidationRule = function number({ value }) {
  return !isNaN(value as number)
}

export default number
