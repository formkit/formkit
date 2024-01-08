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
  FormKitComponent,
  FormKitSetupContext,
  Slots,
  parentSymbol,
  componentSymbol,
  getCurrentSchemaNode,
} from './FormKit'

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
 * The FormKitSummary component.
 * @public
 */
export { FormKitSummary, FormKitSummaryMessage } from './FormKitSummary'

/**
 * The FormKitSchema component.
 */
export {
  FormKitSchema,
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
export {
  defaultConfig,
  DefaultConfigOptions,
  PluginConfigs,
} from './defaultConfig'

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
 * Export the reset count explicitly
 */
export {
  resetCount,
  errorHandler,
  setErrors,
  clearErrors,
  submitForm,
  reset,
} from '@formkit/core'

/**
 * SSR support for cleanup operations relating to SSR.
 */
export { ssrComplete, onSSRComplete } from './composables/onSSRComplete'
