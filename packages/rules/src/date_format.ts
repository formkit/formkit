import { regexForFormat } from '@formkit/utils'
import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value matches a specified date format.
 * @param context - The FormKitValidationContext
 * @public
 */
const date_format: FormKitValidationRule = function date(
  { value },
  format?: string
) {
  if (format && typeof format === 'string') {
    return regexForFormat(format).test(String(value))
  }
  return !isNaN(Date.parse(String(value)))
}

export default date_format
