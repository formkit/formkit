import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is between two other values.
 * @param context - The FormKitValidationContext
 * @public
 */
const between: FormKitValidationRule = function between(
  { value },
  from: any,
  to: any
) {
  if (!isNaN(value as number) && !isNaN(from) && !isNaN(to)) {
    const val = 1 * (value as number)
    return val >= 1 * from && val <= 1 * to
  }
  return false
}

export default between
