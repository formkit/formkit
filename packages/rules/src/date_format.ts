import { regexForFormat } from '@formkit/utils'
import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value matches a specific date
 * @param context - The FormKitValidationContext
 * @public
 */
const date_format: FormKitValidationRule = function date(
  { value },
  format?: string
) {
  if (format && typeof format === 'string') {
    return regexForFormat(format).test(value)
  }
  return !isNaN(Date.parse(value))
}

export default date_format
