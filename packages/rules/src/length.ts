import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value length is full width.
 * @param context - The FormKitValidationContext
 * @public
 */
const length: FormKitValidationRule = function length(
  { value },
  min = 5,
  max = false
) {
  let passMin = false
  let passMax = max ? false : true
  if (typeof value === 'string' || Array.isArray(value)) {
    passMin = value.length >= min
    passMax = passMax || value.length <= max
  } else if (value && typeof value === 'object') {
    const length = Object.keys(value).length
    passMin = length >= min
    passMax = passMax || length <= max
  }
  return passMin && passMax
}

export default length
