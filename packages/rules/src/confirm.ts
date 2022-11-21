import type { FormKitValidationRule } from '@formkit/validation'

const hasConfirm = /(_confirm(?:ed)?)$/

/**
 * Determine if the given input's value matches another input's value
 * @param context - The FormKitValidationContext
 * @public
 */
const confirm: FormKitValidationRule = function confirm(
  node,
  address?,
  comparison = 'loose'
) {
  if (!address) {
    address = hasConfirm.test(node.name)
      ? node.name.replace(hasConfirm, '')
      : `${node.name}_confirm`
  }
  const foreignValue = node.at(address)?.value
  return comparison === 'strict'
    ? node.value === foreignValue
    : node.value == foreignValue
}

export default confirm
