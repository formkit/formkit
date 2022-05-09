import {
  warningHandler,
  errorHandler,
  FormKitHandlerPayload,
  FormKitNode,
} from '@formkit/core'
import { FormKitMiddleware } from 'packages/core/src'

let registered = false

/**
 * Catalog of the error message codes in FormKit.
 * @public
 */
const errors: Record<
  string | number,
  string | ((error: FormKitHandlerPayload) => string)
> = {
  /**
   * FormKit errors:
   */
  100: ({ data: node }: { data: FormKitNode }) =>
    `Only groups, lists, and forms can have children (${node.name}).`,
  101: ({ data: node }: { data: FormKitNode }) =>
    `You cannot directly modify the store (${node.name}). See: https://formkit.com/advanced/core#message-store`,
  102: ({
    data: [node, property],
  }: {
    data: [node: FormKitNode, property: string]
  }) => `You cannot directly assign node.${property} (${node.name})`,
  103: ({ data: [operator] }) =>
    `Schema expressions cannot start with an operator (${operator})`,
  104: ({ data: [operator, expression] }) =>
    `Schema expressions cannot end with an operator (${operator} in "${expression}")`,
  105: ({ data: expression }) => `Invalid schema expression: ${expression}`,
  106: ({ data: name }) => `Cannot submit because (${name}) is not in a form.`,
  107: ({ data: [node, value] }: { data: [FormKitNode, unknown] }) =>
    `Cannot set ${node.name} to non object value: ${value}`,
  108: ({ data: [node, value] }: { data: [FormKitNode, unknown] }) =>
    `Cannot set ${node.name} to non array value: ${value}`,
  /**
   * FormKit vue errors:
   */
  600: ({ data: node }: { data: FormKitNode }) =>
    `Unknown input type${
      typeof node.props.type === 'string' ? ' "' + node.props.type + '"' : ''
    } ("${node.name}")`,
  601: ({ data: node }: { data: FormKitNode }) =>
    `Input definition${
      typeof node.props.type === 'string' ? ' "' + node.props.type + '"' : ''
    } is missing a schema or component property (${node.name}).`,
}

/**
 * Catalog of the warning message codes in FormKit.
 * @public
 */
const warnings: Record<
  string | number,
  string | ((error: FormKitHandlerPayload) => string)
> = {
  /**
   * Core warnings:
   */
  150: ({ data: fn }: { data: string }) =>
    `Schema function "${fn}()" is not a valid function.`,
  151: ({ data: id }: { data: string }) => `No form element with id: ${id}`,
  152: ({ data: id }: { data: string }) => `No input element with id: ${id}`,
  /**
   * Input specific warnings:
   */
  350: ({ data: node }: { data: FormKitNode }) =>
    `Invalid options prop for radio input (${node.name}). See https://formkit.com/inputs/radio`,
  /**
   * Vue warnings:
   */
  650: 'Schema "$get()" must use the id of an input to access.',
  651: ({ data: id }: { data: string }) =>
    `Cannot setErrors() on "${id}" because no such id exists.`,
  652: ({ data: id }: { data: string }) =>
    `Cannot clearErrors() on "${id}" because no such id exists.`,
}

/**
 * Decodes an error that is being emitted and console logs it.
 * @param error - The error currently being handled
 * @param next - Call additional handlers
 * @returns
 */
const decodeErrors: FormKitMiddleware<FormKitHandlerPayload> = (
  error: FormKitHandlerPayload,
  next
) => {
  if (error.code in errors) {
    const err = errors[error.code]
    error.message = typeof err === 'function' ? err(error) : err
  }
  return next(error)
}

if (!registered) errorHandler(decodeErrors)

/**
 * Decodes an error that is being emitted and console logs it.
 * @param error - The error currently being handled
 * @param next - Call additional handlers
 * @returns
 */
const decodeWarnings: FormKitMiddleware<FormKitHandlerPayload> = (
  warning: FormKitHandlerPayload,
  next
) => {
  if (warning.code in warnings) {
    const warn = warnings[warning.code]
    warning.message = typeof warn === 'function' ? warn(warning) : warn
  }
  return next(warning)
}

if (!registered) warningHandler(decodeWarnings)

registered = true

// Some bundlers need to see an export:
export { errors, warnings }
