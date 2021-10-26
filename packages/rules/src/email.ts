import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is a plausible email address.
 * @param context - The FormKitValidationContext
 * @public
 */
const email: FormKitValidationRule = function email({ value }) {
  const isEmail = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
  return isEmail.test(String(value))
}

export default email
