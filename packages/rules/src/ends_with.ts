import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value ends with a given string.
 * @param context - The FormKitValidationContext
 * @public
 */
const ends_with: FormKitValidationRule = function ends_with(
  { value },
  ...stack: string[]
) {
  if (typeof value === 'string' && stack.length) {
    return stack.some((item) => {
      return value.endsWith(item)
    })
  } else if (typeof value === 'string' && stack.length === 0) {
    return true
  }
  return false
}

export default ends_with
