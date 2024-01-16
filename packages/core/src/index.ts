/**
 * The official FormKit core library. This package is responsible for most of FormKit’s internal functionality.
 * You can read documentation specifically on how it works at formkit.com.
 *
 * You can add this package by using `npm install @formkit/core` or `yarn add @formkit/core`.
 *
 * @packageDocumentation
 */

/**
 * The current version of FormKit at the time the package is published. Is replaced
 * as part of the publishing script.
 *
 * @internal
 */
export const FORMKIT_VERSION = '__FKV__'

/**
 * Include all exported methods from node, this is the primary API.
 */
export * from './node'

/**
 * Include createMessage to create new messages.
 */
export {
  createMessage,
  ChildMessageBuffer,
  FormKitInputMessages,
  FormKitMessage,
  FormKitMessageMeta,
  FormKitMessageStore,
  FormKitMessageProps,
  FormKitStore,
  ErrorMessages,
  FormKitStoreTraps,
  MessageClearer,
} from './store'

/**
 * The FormKit ledger.
 */
export {
  FormKitLedger,
  FormKitCounterCondition,
  FormKitCounter,
} from './ledger'

/**
 * Export dispatcher typings.
 */
export { FormKitDispatcher, FormKitMiddleware } from './dispatcher'

/**
 * Export event typings.
 */
export {
  FormKitEventListener,
  FormKitEvent,
  FormKitEventEmitter,
} from './events'

/**
 * Export errors emitters.
 */
export {
  FormKitHandlerPayload,
  errorHandler,
  warningHandler,
  warn,
  error,
} from './errors'

/**
 * Export all schema features.
 */
export {
  FormKitAttributeValue,
  FormKitExtendableSchemaRoot,
  FormKitListStatement,
  FormKitListValue,
  FormKitSchemaAttributes,
  FormKitSchemaAttributesCondition,
  FormKitSchemaComponent,
  FormKitSchemaComposable,
  FormKitSchemaCondition,
  FormKitSchemaContext,
  FormKitSchemaDOMNode,
  FormKitSchemaFormKit,
  FormKitSchemaMeta,
  FormKitSchemaNode,
  FormKitSchemaProps,
  FormKitSchemaTextNode,
  FormKitSchemaDefinition,
  FormKitSectionsSchema,
  isComponent,
  isConditional,
  isDOM,
  isSugar,
  sugar,
} from './schema'

/**
 * Export the FormKit logic compiler.
 */
export {
  compile,
  FormKitCompilerOutput,
  FormKitCompilerProvider,
} from './compiler'

/**
 * Export classes.
 */
export * from './classes'

/**
 * Export the global registry.
 */
export * from './registry'

/**
 * The root configuration creator.
 */
export { createConfig, FormKitRootConfig } from './config'

/**
 * Sets error store messages on inputs.
 */
export * from './setErrors'

/**
 * Programmatically submits a form by the id.
 */
export { submitForm } from './submitForm'

/**
 * Programmatically reset an input.
 */
export { reset } from './reset'
