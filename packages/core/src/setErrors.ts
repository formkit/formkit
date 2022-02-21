import { getNode } from './registry'
import { ErrorMessages } from './store'
import { warn } from './errors'

/**
 * Sets errors on a form, group, or input.
 * @param formId - The id of a form
 * @param localErrors - The errors to set on the form or the form’s inputs
 * @param childErrors - (optional) The errors to set on the form or the form’s inputs
 * @public
 */
export function setErrors(
  id: string,
  localErrors: ErrorMessages,
  childErrors?: ErrorMessages
): void {
  const node = getNode(id)
  if (node) {
    node.setErrors(localErrors, childErrors)
  } else {
    warn(651, id)
  }
}
