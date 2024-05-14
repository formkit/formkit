import { empty } from '@formkit/utils'
import type { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if any of the given inputs have a value.
 * @param context - The FormKitValidationContext
 * @public
 */
const require_one: FormKitValidationRule = function (
  node,
  ...inputNames: string[]
) {
  if (!empty(node.value)) return true

  const values = inputNames.map(name => node.at(name)?.value)
  return values.some(value => !empty(value))
}

require_one.skipEmpty = false

export default require_one
