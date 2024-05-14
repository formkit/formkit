import { FormKitNode, FormKitPlugin, createMessage } from '@formkit/core'
import { TSchema, Static } from '@sinclair/typebox'
import { TypeCompiler, ValueErrorIterator } from '@sinclair/typebox/compiler'
import { ValueError } from '@sinclair/typebox/errors'

/**
 * Extend FormKitNode with setTypeboxErrors.
 */
declare module '@formkit/core' {
  interface FormKitNodeExtensions {
    setTypeboxErrors(typeboxErrors: ValueErrorIterator | undefined): FormKitNode
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
 * Creates a new Typebox schema plugin for form validation.
 *
 * @param typeboxSchema - A Typebox schema to validate the form against.
 * @param submitCallback - A callback to run when the form is submitted and it passes validation.
 *
 * @returns A tuple of a {@link @formkit/core#FormKitPlugin | FormKitPlugin} and a submit handler.
 *
 * @public
 */
export function createTypeboxPlugin<T extends TSchema>(
  typeboxSchema: T,
  submitCallback: (
    payload: Static<typeof typeboxSchema>,
    node: FormKitNode | undefined
  ) => void | Promise<void>
): [FormKitPlugin, (payload: any, node: FormKitNode | undefined) => void] {
  const typeboxValidationSet = new Set<FormKitNode>()
  const typeboxValidationListeners = new Map<FormKitNode, string>()
  const typeboxChecker = TypeCompiler.Compile(typeboxSchema)

  // The Typebox plugin — maps typebox schema to validation rules on
  // matching FormKit nodes.
  const typeboxPlugin = (node: FormKitNode) => {
    if (node.props.type !== 'form') return false

    node.ledger.count('existingValidation', (message) => {
      if (message.type === 'validation' || message.type === 'error') {
        return !message.key.endsWith(':typebox')
      }
      return false
    })

    node.on('created', () => {
      node.extend('setTypeboxErrors', {
        get: (node) => async (errorIterator: ValueErrorIterator) => {
          const allErrors = [...errorIterator]
          if (allErrors.length === 0) return
          await node.settled
          const [formErrors, fieldErrors] = typeboxErrorToFormKitErrors(allErrors, node)
          node.setErrors(fieldErrors, formErrors)
        },
        set: false,
      })
    })

    node.on('destroyed', () => {
      typeboxValidationSet.clear()
      typeboxValidationListeners.clear()
    })

    let commitTimout: ReturnType<typeof setTimeout> | number = 0
    let start = Date.now()
    node.on('commit', ({ payload }) => {
      clearTimeout(commitTimout)
      const now = Date.now()
      // perform at least every 600ms
      if (now - start > 600) {
        start = now
        performTypeboxValidation(payload, node)
      }
      // also perform after 150ms of no commits
      commitTimout = setTimeout(() => {
        performTypeboxValidation(payload, node)
      }, 150)
    })

    node.on('message-added', (message) => {
      if (
        message.payload.type === 'state' &&
        message.payload.key === 'submitted'
      ) {
        // perform validation on submit so that check
        // for form level errors can be done
        performTypeboxValidation(node.value, node)
      }
    })

    return false
  }

  function performTypeboxValidation(payload: any, node: FormKitNode) {
    const typeboxErrors = [...typeboxChecker.Errors(payload)]
    if (typeboxErrors.length > 0) {
      setFormValidations(typeboxErrors, node)
    } else {
      typeboxValidationSet.forEach((node) => {
        node.store.remove(`${node.address.slice(1).join('.')}:typebox`)
        const receipt = typeboxValidationListeners.get(node)
        node.off(receipt as string)
        typeboxValidationListeners.delete(node)
      })
      typeboxValidationSet.clear()
    }
  }

  // The submit handler — validates the payload against the typebox schema
  // and then passes the data to the user's submit callback.
  async function submitHandler(payload: any, node?: FormKitNode | undefined) {
    const typeboxErrors = [...typeboxChecker.Errors(payload)]
    if (typeboxErrors.length > 0) {
      setFormValidations(typeboxErrors, node)
    } else {
      await submitCallback(payload, node)
    }
  }

  // Sets the form errors on the correct nodes.
  function setFormValidations(
    typeboxErrors: ValueError[],
    node?: FormKitNode | undefined
  ) {
    if (!node) return
    const [formErrors, InputErrors] = typeboxErrorToFormKitErrors(typeboxErrors, node)
    const oldTypeboxValidationSet = new Set(typeboxValidationSet)
    Object.entries(InputErrors).map((issue) => {
      const [path, message] = issue
      const targetNode = node.at(path)
      if (targetNode) {
        oldTypeboxValidationSet.delete(targetNode)
        const existingValidationCount =
          targetNode.ledger.value('existingValidation')
        if (existingValidationCount === 0) {
          if (!targetNode.store[`${path}:typebox`]) {
            const validationListener = targetNode.on(
              'unsettled:existingValidation',
              () => {
                targetNode.store.remove(`${path}:typebox`)
                typeboxValidationSet.delete(targetNode)
              }
            )
            typeboxValidationListeners.set(targetNode, validationListener)
          }

          targetNode.store.set(
            createMessage({
              blocking: true,
              type: 'validation',
              key: `${path}:typebox`,
              value: message,
              meta: {
                i18nArgs: [
                  {
                    node: targetNode,
                    name: createMessageName(targetNode),
                    args: [issue],
                  },
                ],
                messageKey: 'typebox',
              },
            })
          )
          typeboxValidationSet.add(targetNode)
        }
      }
    })

    // on submit, all remaining errors are global errors
    if (node?.context?.state.submitted) {
      node.setErrors([], formErrors)
    }

    oldTypeboxValidationSet.forEach((node) => {
      node.store.remove(`${node.address.slice(1).join('.')}:typebox`)
      typeboxValidationSet.delete(node)
    })
  }

  function typeboxErrorToFormKitErrors(
    typeboxErrors: ValueError[],
    node: FormKitNode
  ): [string[], Record<string, string>] {
    const fieldErrors: Record<string, string> = {}
    const formErrors: string[] = []
    typeboxErrors.forEach((error) => {
      const path = error.path
        .replace('/', '')
        .replaceAll('/', '.')
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

  return [typeboxPlugin, submitHandler]
}
