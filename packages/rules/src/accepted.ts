import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value was should be considered "accepted".
 * @param context - The FormKitValidationContext
 */
const accepted: FormKitValidationRule = function accepted({ value }) {
  return ['yes', 'on', '1', 1, true, 'true'].includes(value)
}

export default accepted
