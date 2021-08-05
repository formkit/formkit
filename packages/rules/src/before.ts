import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value before a given date.
 * @param context - The FormKitValidationContext
 */
const before: FormKitValidationRule = function ({ value }, compare = false) {
  const timestamp = Date.parse(compare || new Date())
  const fieldValue = Date.parse(value)
  return isNaN(fieldValue) ? false : fieldValue < timestamp
}

export default before
