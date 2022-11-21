import { eq } from '@formkit/utils'
import type { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is in a set of possible values.
 * @param context - The FormKitValidationContext
 * @public
 */
const is: FormKitValidationRule = function is({ value }, ...stack: any[]) {
  return stack.some((item) => {
    if (typeof item === 'object') {
      return eq(item, value)
    }
    return item == value
  })
}

export default is
