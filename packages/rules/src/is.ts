import { eq } from '@formkit/utils'
import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is in a set of possible values.
 * @param context - The FormKitValidationContext
 * @public
 */
const is: FormKitValidationRule = function is({ value }, ...stack: any[]) {
  const ret = stack.some((item) => {
    if (typeof item === 'object') {
      return eq(item, value)
    }
    return item == value
  })
  console.log('isRule', ret)
  return ret
}

export default is
