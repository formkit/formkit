import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is numeric
 * @param context - The FormKitValidationContext
 */
const number: FormKitValidationRule = function number({ value }) {
  return !isNaN(value)
}

export default number
