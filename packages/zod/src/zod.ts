import { FormKitNode, FormKitPlugin, createMessage } from '@formkit/core'
import { z } from 'zod'

function createMessageName(node: FormKitNode): string {
  if (typeof node.props.validationLabel === 'function') {
    return node.props.validationLabel(node)
  }
  return (
    node.props.validationLabel ||
    node.props.label ||
    node.props.name ||
    String(node.name)
  )
}

/**
 * Creates a new Zod schema plugin.
 *
 * @param zodSchema - A Zod schema to validate the form against.
 * @param submitCallback - A callback to run when the form is submitted and it passes validation.
 *
 * @returns A tuple of a {@link @formkit/core#FormKitPlugin | FormKitPlugin} and a submit handler.
 *
 * @public
 */
export function createZodPlugin<Z extends z.ZodTypeAny>(
  zodSchema: Z,
  submitCallback: (payload: z.infer<typeof zodSchema>) => void | Promise<void>
): [FormKitPlugin, (payload: any, node: FormKitNode) => void] {
  const zodValidationSet = new Set<FormKitNode>()
  const zodValidationListeners = new Map<FormKitNode, string>()
  // The Zod plugin — maps zod schema to validation rules on
  // matching FormKit nodes.
  const zodPlugin = (node: FormKitNode) => {
    if (node.props.type !== 'form') return false
    let commitTimout: ReturnType<typeof setTimeout> | number = 0
    let start = Date.now()
    node.on('commit', ({ payload }) => {
      clearTimeout(commitTimout)
      const now = Date.now()
      // perform at least every 600ms
      if (now - start > 600) {
        start = now
        performZodValidation(payload, node)
      }
      // also perform after 200ms of no commits
      commitTimout = setTimeout(() => {
        performZodValidation(payload, node)
      }, 200)
    })
    node.on('message-added', (message) => {
      if (
        message.payload.type === 'state' &&
        message.payload.key === 'submitted'
      ) {
        // perform validation on submit so that check
        // for form level errors can be done
        performZodValidation(node.value, node)
      }
    })
    node.ledger.count('nonZodValidation', (message) => {
      if (message.type === 'validation') {
        return !message.key.endsWith(':zod')
      }
      return false
    })
    return false
  }

  function performZodValidation(payload: any, node: FormKitNode) {
    const zodResults = zodSchema.safeParse(payload)
    if (!zodResults.success) {
      setFormValidations(zodResults.error, node)
    } else {
      zodValidationSet.forEach((node) => {
        node.store.remove(`zod`)
        const receipt = zodValidationListeners.get(node)
        node.off(receipt as string)
        zodValidationListeners.delete(node)
      })
      zodValidationSet.clear()
    }
  }

  // The submit handler — validates the payload against the zod schema
  // and then passes the data to the user's submit callback.
  async function submitHandler(payload: any, node: FormKitNode) {
    const zodResults = await zodSchema.safeParseAsync(payload)
    if (!zodResults.success) {
      setFormValidations(zodResults.error, node)
    } else {
      await submitCallback(zodResults as z.infer<Z>)
    }
  }

  // Sets the form errors on the correct nodes.
  function setFormValidations(zodErrors: z.ZodError, node: FormKitNode) {
    const allErrors = buildFormValidationMessages(zodErrors)
    const oldZodValidationSet = new Set(zodValidationSet)
    Object.entries(allErrors).map((error) => {
      const [path, issue] = error
      const targetNode = node.at(path)
      if (targetNode) {
        // Remove the error
        delete allErrors[path]
        oldZodValidationSet.delete(targetNode)

        const nonZodValidationCount =
          targetNode.ledger.value('nonZodValidation')
        if (nonZodValidationCount === 0) {
          if (!targetNode.store[`${path}:zod`]) {
            const validationListener = targetNode.on(
              'unsettled:nonZodValidation',
              () => {
                targetNode.store.remove(`${path}:zod`)
                zodValidationSet.delete(targetNode)
              }
            )
            zodValidationListeners.set(targetNode, validationListener)
          }

          targetNode.store.set(
            createMessage({
              blocking: true,
              type: 'validation',
              key: `${path}:zod`,
              value: issue.message,
              meta: {
                i18nArgs: [
                  {
                    node: targetNode,
                    name: createMessageName(targetNode),
                    args: [issue],
                  },
                ],
                messageKey: 'zod',
              },
            })
          )
          zodValidationSet.add(targetNode)
        }
      }
    })

    // on submit, all remaining errors are global errors
    if (node?.context?.state.submitted) {
      const formErrors = Object.keys(allErrors).map((error) => {
        return `${error}: ${allErrors[error].message}`
      })
      node.setErrors([], formErrors)
    }

    oldZodValidationSet.forEach((node) => {
      node.store.remove(`${node.address.slice(1).join('.')}:zod`)
      zodValidationSet.delete(node)
    })
  }

  // Builds a FormKit errors object from the zod error object.
  function buildFormValidationMessages(
    zodError: z.ZodError
  ): Record<string, z.ZodIssue> {
    const formErrors: Record<string, z.ZodIssue> = {}
    zodError.errors.forEach((error) => {
      const path = error.path.join('.')
      formErrors[path] = error
    })
    return formErrors
  }

  return [zodPlugin, submitHandler]
}
