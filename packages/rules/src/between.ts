import type { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is between two other values.
 * @param context - The FormKitValidationContext
 * @public
 */
const between: FormKitValidationRule = function between(
  { value },
  from: any,
  to: any
) {
  if (!isNaN(value as number) && !isNaN(from) && !isNaN(to)) {
    const val = 1 * (value as number)
    from = Number(from)
    to = Number(to)
    const [a, b] = from <= to ? [from, to] : [to, from]
    return val >= 1 * a && val <= 1 * b
  }
  return false
}

export default between
