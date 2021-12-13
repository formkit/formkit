import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value length is full width.
 * @param context - The FormKitValidationContext
 * @public
 */
const length: FormKitValidationRule = function length(
  { value },
  first = 0,
  second = Infinity
) {
  first = parseInt(first)
  second = isNaN(parseInt(second)) ? Infinity : parseInt(second)
  const min = first <= second ? first : second
  const max = second >= first ? second : first
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length >= min && value.length <= max
  } else if (value && typeof value === 'object') {
    const length = Object.keys(value).length
    return length >= min && length <= max
  }
  return false
}

export default length
