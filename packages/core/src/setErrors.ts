import { FormKitNode } from './node'
import { FormKitMessage, createMessage } from './store'
import { getNode } from './registry'
import { warn } from './errors'

/**
 * Creates an array of message arrays from strings.
 * @param errors - Arrays or objects of form errors or input errors
 * @returns
 */
function createMessages(
  node: FormKitNode,
  ...errors: Array<string[] | Record<string, string | string[]> | undefined>
): Array<FormKitMessage[] | Record<string, FormKitMessage[]>> {
  return errors
    .filter((m) => !!m)
    .map((errorSet): FormKitMessage[] | Record<string, FormKitMessage[]> => {
      const sourceKey = `${node.name}-set`
      const make = (error: string) =>
        createMessage({
          key: error,
          type: 'error',
          value: error,
          meta: { source: sourceKey },
        })
      if (Array.isArray(errorSet)) {
        return errorSet.map((error) => make(error))
      } else {
        const errors: Record<string, FormKitMessage[]> = {}
        for (const key in errorSet) {
          if (Array.isArray(errorSet[key])) {
            errors[key] = (errorSet[key] as string[]).map((error) =>
              make(error)
            )
          } else {
            errors[key] = [make(errorSet[key] as string)]
          }
        }
        return errors
      }
    })
}

/**
 * Sets errors on a form, group, or input.
 * @param formId - The id of a form
 * @param localErrors - The errors to set on the form or the form’s inputs
 * @param childErrors - (optional) The errors to set on the form or the form’s inputs
 * @public
 */
export function setErrors(
  id: string,
  localErrors: string[] | Record<string, string | string[]>,
  childErrors?: string[] | Record<string, string | string[]>
): void {
  const node = getNode(id)
  if (node) {
    const sourceKey = `${node.name}-set`
    createMessages(node, localErrors, childErrors).forEach((errors) => {
      node.store.apply(errors, (message) => message.meta.source === sourceKey)
    })
  } else {
    warn(651, id)
  }
}
