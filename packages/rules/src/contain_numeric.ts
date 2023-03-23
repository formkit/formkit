import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value contain numeric
 * @param context - The FormKitValidationContext
 * @public
 */
const contain_numeric: FormKitValidationRule = function number({ value }) {
  return /[0-9]/.test(String(value))

}

export default contain_numeric
