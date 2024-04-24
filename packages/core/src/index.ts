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
export { createMessage } from './store'
export type {
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
export type {
  FormKitLedger,
  FormKitCounterCondition,
  FormKitCounter,
} from './ledger'

/**
 * Export dispatcher typings.
 */
export type { FormKitDispatcher, FormKitMiddleware } from './dispatcher'

/**
 * Export event typings.
 */
export type {
  FormKitEventListener,
  FormKitEvent,
  FormKitEventEmitter,
} from './events'

/**
 * Export errors emitters.
 */
export { errorHandler, warningHandler, warn, error } from './errors'
export type { FormKitHandlerPayload } from './errors'

/**
 * Export all schema features.
 */
export type {
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
} from './schema'
export { isComponent, isConditional, isDOM, isSugar, sugar } from './schema'

/**
 * Export the FormKit logic compiler.
 */
export { compile } from './compiler'
export type { FormKitCompilerOutput, FormKitCompilerProvider } from './compiler'

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
export { createConfig } from './config'
export type { FormKitRootConfig } from './config'

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

/**
 * The message localizer.
 */
export { localize } from './localize'
