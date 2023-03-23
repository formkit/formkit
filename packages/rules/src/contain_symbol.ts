import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is only alpha characters.
 * @param context - The FormKitValidationContext
 * @public
 */
const contain_symbol: FormKitValidationRule = function ({ value }) {
  return /[#?!@$%^&*-]+/.test(String(value))
}

export default contain_symbol
