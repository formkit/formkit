import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is before or equal to a given date.
 * @param context - The FormKitValidationContext
 * @public
 */
const date_before_or_equal: FormKitValidationRule = function (
  { value },
  compare = false
) {
  const timestamp = Date.parse(compare || new Date())
  const fieldValue = Date.parse(String(value))
  return isNaN(fieldValue) ? false : fieldValue < timestamp || fieldValue === timestamp
}

export default date_before_or_equal
