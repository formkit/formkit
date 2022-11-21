import type { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is after a given date.
 * Defaults to current time.
 * @param context - The FormKitValidationContext
 * @public
 */
const date_after: FormKitValidationRule = function (
  { value },
  compare = false
) {
  const timestamp = Date.parse(compare || new Date())
  const fieldValue = Date.parse(String(value))
  return isNaN(fieldValue) ? false : fieldValue > timestamp
}

export default date_after
