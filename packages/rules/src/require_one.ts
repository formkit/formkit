import { empty } from '@formkit/utils'
import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if one of the given input's value was required.
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
