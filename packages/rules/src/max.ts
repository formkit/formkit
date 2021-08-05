import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is less than the maximum
 * @param context - The FormKitValidationContext
 */
const max: FormKitValidationRule = function max({ value }, maximum = 10) {
  if (Array.isArray(value)) {
    return value.length <= maximum
  }
  return value <= maximum
}

export default max
