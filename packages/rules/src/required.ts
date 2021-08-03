import { empty } from '@formkit/utils'
import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value was required.
 * @param context - The FormKitValidationContext
 */
const required: FormKitValidationRule = function required({ value }) {
  return !empty(value)
}

/**
 * This rules should run even if the inputs is empty (obviously)
 */
required.skipEmpty = true

export default required
