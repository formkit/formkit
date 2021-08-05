import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is less than a certain value.
 * @param context - The FormKitValidationContext
 * @public
 */
const min: FormKitValidationRule = function min({ value }, minimum = 1) {
  if (Array.isArray(value)) {
    return value.length >= minimum
  }
  return value >= minimum
}

export default min
