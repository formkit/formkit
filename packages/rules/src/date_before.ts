import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is before a given date.
 * @param context - The FormKitValidationContext
 * @public
 */
const date_before: FormKitValidationRule = function (
  { value },
  compare = false
) {
  const timestamp = Date.parse(compare || new Date())
  const fieldValue = Date.parse(String(value))
  return isNaN(fieldValue) ? false : fieldValue < timestamp
}

export default date_before
