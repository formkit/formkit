import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value matches one or more regular expressions.
 * @param context - The FormKitValidationContext
 * @public
 */
const matches: FormKitValidationRule = function matches({ value }, ...stack) {
  return stack.some((pattern) => {
    if (
      typeof pattern === 'string' &&
      pattern.substr(0, 1) === '/' &&
      pattern.substr(-1) === '/'
    ) {
      pattern = new RegExp(pattern.substr(1, pattern.length - 2))
    }
    if (pattern instanceof RegExp) {
      return pattern.test(String(value))
    }
    return pattern === value
  })
}

export default matches
