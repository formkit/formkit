import type { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is an http url
 * @param context - The FormKitValidationContext
 * @public
 */
const url: FormKitValidationRule = function url({ value }, ...stack) {
  try {
    const protocols = stack.length ? stack : ['http:', 'https:']
    const url = new URL(String(value))
    return protocols.includes(url.protocol)
  } catch {
    return false
  }
}

export default url
