import type { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value starts with a substring
 * @param context - The FormKitValidationContext
 * @public
 */
const starts_with: FormKitValidationRule = function starts_with(
  { value },
  ...stack
) {
  if (typeof value === 'string' && stack.length) {
    return stack.some((item) => {
      return value.startsWith(item)
    })
  } else if (typeof value === 'string' && stack.length === 0) {
    return true
  }
  return false
}

export default starts_with
