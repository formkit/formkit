import { empty } from '@formkit/utils'
import type { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is required.
 * @param context - The FormKitValidationContext
 * @public
 */
const required: FormKitValidationRule = function required({ value }, action = 'default') {
  return action === 'trim' && typeof value === 'string'
    ? !empty(value.trim())
    : !empty(value)
}

/**
 * This rules should run even if the inputs is empty (obviously)
 */
required.skipEmpty = false

export default required
