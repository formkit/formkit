import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is after or equal to a given date.
 * Defaults to current time.
 * @param context - The FormKitValidationContext
 * @public
 */
const date_after_or_equal: FormKitValidationRule = function (
  { value },
  compare = false
) {
  const timestamp = Date.parse(compare || new Date())
  const fieldValue = Date.parse(String(value))
  return isNaN(fieldValue) ? false : fieldValue > timestamp || fieldValue === timestamp
}

export default date_after_or_equal
