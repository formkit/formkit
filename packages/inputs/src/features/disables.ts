import { FormKitNode } from '@formkit/core'

/**
 * Determines what the value of the config/prop "disabled" should be.
 * @param value - Value
 * @returns
 */
function undefine(value: any) {
  return value !== undefined && value !== 'false' && value !== false
    ? true
    : undefined
}

/**
 * Allows disabling children of this.
 * @param node - The FormKitNode of the form/group/list
 */
export default function (node: FormKitNode): void {
  node.hook.prop(({ prop, value }, next) => {
    value = prop === 'disabled' ? undefine(value) : value
    return next({ prop, value })
  })
  node.on('prop:disabled', ({ payload: value }) => {
    node.config.disabled = value
  })
  node.on('created', () => {
    node.config.disabled = undefine(node.props.disabled)
  })
}
