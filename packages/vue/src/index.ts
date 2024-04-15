import type { FormKitRootConfig } from '@formkit/core'
/**
 * The official FormKit/Vue integration. This package is responsible for
 * integrating Vue with FormKit core and other first-party packages.
 *
 *
 * @packageDocumentation
 */

declare global {
  // eslint-disable-next-line no-var
  var __FORMKIT_CONFIGS__: FormKitRootConfig[]
}

/**
 * The useInput composable.
 */
export { useInput } from './composables/useInput'

/**
 * Shorthand for creating inputs with standard FormKit features.
 */
export { createInput } from './composables/createInput'

/**
 * The defineFormKitConfig composable.
 */
export { defineFormKitConfig } from './composables/defineFormKitConfig'

/**
 * The plugin and plugin types.
 */
export * from './plugin'

/**
 * The root FormKit component.
 */
export {
  default as FormKit,
  parentSymbol,
  componentSymbol,
  getCurrentSchemaNode,
} from './FormKit'
export type { FormKitComponent, FormKitSetupContext, Slots } from './FormKit'

/**
 * The FormKitRoot wrapper component used to provide context to FormKit
 * about whether a FormKit input is booting in a Document or ShadowRoot.
 */
export { FormKitRoot, rootSymbol } from './FormKitRoot'

/**
 * The FormKitKitchenSink component.
 */
export { FormKitKitchenSink } from './FormKitKitchenSink'

/**
 * The FormKitMessages component.
 * @public
 */
export { FormKitMessages } from './FormKitMessages'

/**
 * The FormKitProvider component.
 * @public
 */
export {
  FormKitProvider,
  FormKitLazyProvider,
  useConfig,
} from './FormKitProvider'

/**
 * Exports the useFormKitContext composable.
 */
export {
  useFormKitContext,
  useFormKitContextById,
  useFormKitNodeById,
} from './composables/useContext'

/**
 * The FormKitSummary component.
 * @public
 */
export { FormKitSummary } from './FormKitSummary'
export type { FormKitSummaryMessage } from './FormKitSummary'

/**
 * The FormKitSchema component.
 */
export { FormKitSchema } from './FormKitSchema'
export type {
  Renderable,
  RenderableList,
  RenderableSlot,
  RenderableSlots,
  FormKitComponentLibrary,
  VirtualNode,
} from './FormKitSchema'

/**
 * The default configuration.
 */
export { defaultConfig } from './defaultConfig'
export type { DefaultConfigOptions } from './defaultConfig'
export type {
  PluginConfigs,
  DefineConfigOptions,
} from './composables/defineFormKitConfig'

/**
 * The vue specific FormKit core plugin. This is generally required for all
 * vue based FormKit configurations.
 */
export { default as bindings } from './bindings'

/**
 * A vue component for rendering icons from the FormKit icon registry
 */
export { FormKitIcon } from './FormKitIcon'

/**
 * The counter reset for sequential identifiers.
 */
export { resetCount } from './utilities/resetCount'

/**
 * Export the reset count explicitly
 */
export {
  errorHandler,
  setErrors,
  clearErrors,
  submitForm,
  reset,
} from '@formkit/core'

/**
 * Export the changeLocale function explicitly.
 */
export { changeLocale } from '@formkit/i18n'

/**
 * SSR support for cleanup operations relating to SSR.
 */
export { ssrComplete, onSSRComplete } from './composables/onSSRComplete'
