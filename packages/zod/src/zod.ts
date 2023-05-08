import { FormKitNode, FormKitPlugin, createMessage } from '@formkit/core'
import { whenAvailable } from '@formkit/utils'
import { z } from 'zod'

declare module '@formkit/core' {
  interface FormKitNodeExtensions {
    setZodErrors(zodError: z.ZodError | undefined): FormKitNode
  }
}

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
 * Creates a new Zod schema plugin for form validation.
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
  submitCallback: (
    payload: z.infer<typeof zodSchema>,
    node: FormKitNode | undefined
  ) => void | Promise<void>
): [FormKitPlugin, (payload: any, node: FormKitNode | undefined) => void] {
  const zodValidationSet = new Set<FormKitNode>()
  const zodValidationListeners = new Map<FormKitNode, string>()
  // The Zod plugin — maps zod schema to validation rules on
  // matching FormKit nodes.
  const zodPlugin = (node: FormKitNode) => {
    if (node.props.type !== 'form') return false

    node.ledger.count('existingValidation', (message) => {
      if (message.type === 'validation' || message.type === 'error') {
        return !message.key.endsWith(':zod')
      }
      return false
    })

    node.on('created', () => {
      node.extend('setZodErrors', {
        get: (node) => (zodError: z.ZodError) => {
          if (!zodError) return
          whenAvailable(node.props.id as string, () => {
            const [formErrors, fieldErrors] = zodErrorToFormKitErrors(
              zodError,
              node
            )
            node.setErrors(fieldErrors, formErrors)
          })
        },
        set: false,
      })
    })

    node.on('destroyed', () => {
      zodValidationSet.clear()
      zodValidationListeners.clear()
    })

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

    return false
  }

  function performZodValidation(payload: any, node: FormKitNode) {
    // block submission while validation is running
    node.store.set(
      createMessage({
        type: 'state',
        blocking: true,
        visible: false,
        value: true,
        key: 'validating:zod',
      })
    )

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

    // unblock submission
    node.store.remove('validating:zod')
  }

  // The submit handler — validates the payload against the zod schema
  // and then passes the data to the user's submit callback.
  async function submitHandler(payload: any, node?: FormKitNode | undefined) {
    const zodResults = await zodSchema.safeParseAsync(payload)
    if (!zodResults.success) {
      setFormValidations(zodResults.error, node)
    } else {
      await submitCallback(payload as z.infer<Z>, node)
    }
  }

  // Sets the form errors on the correct nodes.
  function setFormValidations(
    zodErrors: z.ZodError,
    node?: FormKitNode | undefined
  ) {
    if (!node) return
    const [formErrors, InputErrors] = zodErrorToFormKitErrors(zodErrors, node)
    const oldZodValidationSet = new Set(zodValidationSet)
    Object.entries(InputErrors).map((issue) => {
      const [path, message] = issue
      const targetNode = node.at(path)
      if (targetNode) {
        oldZodValidationSet.delete(targetNode)
        const existingValidationCount =
          targetNode.ledger.value('existingValidation')
        if (existingValidationCount === 0) {
          if (!targetNode.store[`${path}:zod`]) {
            const validationListener = targetNode.on(
              'unsettled:existingValidation',
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
              value: message,
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
      node.setErrors([], formErrors)
    }

    oldZodValidationSet.forEach((node) => {
      node.store.remove(`${node.address.slice(1).join('.')}:zod`)
      zodValidationSet.delete(node)
    })
  }

  function zodErrorToFormKitErrors(
    zodError: z.ZodError,
    node: FormKitNode
  ): [string[], Record<string, string>] {
    const fieldErrors: Record<string, string> = {}
    const formErrors: string[] = []
    zodError.errors.forEach((error) => {
      const path = error.path.join('.')
      const targetNode = node.at(path)
      if (targetNode) {
        if (!fieldErrors[path]) {
          fieldErrors[path] = error.message
        }
      } else {
        formErrors.push(`${path}: ${error.message}`)
      }
    })
    return [formErrors, fieldErrors]
  }

  return [zodPlugin, submitHandler]
}
