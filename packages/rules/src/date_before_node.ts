import { FormKitValidationRule } from '@formkit/validation'

/**
 * Determine if the given input's value is before a given date.
 * Defaults to current time.
 * @param context - The FormKitValidationContext
 * @public
 */
const date_before_node: FormKitValidationRule = function (
  node,
  address: string
) {
  if (!address) return false

  const fieldValue = Date.parse(String(node.value))
  const foreignValue = Date.parse(String(node.at(address)?.value))

  if (isNaN(foreignValue)) return true

  return isNaN(fieldValue) ? false : fieldValue < foreignValue
}

export default date_before_node
