import { FormKitValidationRule } from '@formkit/validation'
import { eq } from '@formkit/utils'

/**
 * Determine if the given input's value is not in a given stack
 * @param context - The FormKitValidationContext
 */
const not: FormKitValidationRule = function not({ value }, ...stack) {
  return !stack.some((item) => {
    if (typeof item === 'object') {
      return eq(item, value)
    }
    return item === value
  })
}

export default not
