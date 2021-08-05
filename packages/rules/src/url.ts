import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is an http url
 * @param context - The FormKitValidationContext
 */
const url: FormKitValidationRule = function url({ value }, ...stack) {
  try {
    const protocols = stack.length ? stack : ['http:', 'https:']
    const url = new URL(value)
    return protocols.includes(url.protocol)
  } catch {
    return false
  }
}

export default url
