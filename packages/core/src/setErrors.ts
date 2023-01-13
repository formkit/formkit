import { getNode } from './registry'
import { ErrorMessages } from './store'
import { warn } from './errors'

/**
 * Sets errors on a form, group, or input.
 *
 * @param id - The id of a form
 * @param localErrors - The errors to set on the form or the form’s inputs in the format of {@link ErrorMessages | ErrorMessages}
 * @param childErrors - (optional) The errors to set on the form or the form’s inputs in the format of {@link ErrorMessages | ErrorMessages}
 *
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

/**
 * Clears child errors.
 *
 * @param id - The id of the node you want to clear errors for
 * @param clearChildren - Determines if the the children of this node should have their errors cleared.
 *
 * @public
 */
export function clearErrors(id: string, clearChildren = true): void {
  const node = getNode(id)
  if (node) {
    node.clearErrors(clearChildren)
  } else {
    warn(652, id)
  }
}
