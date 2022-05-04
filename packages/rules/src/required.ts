import { empty } from '@formkit/utils'
import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value was required.
 * @param context - The FormKitValidationContext
 * @public
 */
const required: FormKitValidationRule = function required({ value }, action = 'default') {
  return action === 'trim'
    ? !empty(String(value).trim())
    : !empty(value)
}

/**
 * This rules should run even if the inputs is empty (obviously)
 */
required.skipEmpty = false

export default required
