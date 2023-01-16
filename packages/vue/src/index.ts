/**
 * The useInput composable.
 * @public
 */
export { useInput } from './composables/useInput'

/**
 * Shorthand for creating inputs with standard FormKit features.
 */
export { createInput } from './composables/createInput'

/**
 * A special watcher for Vue that reports the location of a deep mutation.
 */
export { default as watchVerbose } from './composables/watchVerbose'

/**
 * The plugin and plugin types.
 * @public
 */
export * from './plugin'

/**
 * The root FormKit component.
 * @public
 */
export { default as FormKit, parentSymbol } from './FormKit'

/**
 * The FormKitMessages component.
 * @public
 */
export { FormKitMessages } from './FormKitMessages'

/**
 * The FormKitSchema component.
 * @public
 */
export { FormKitSchema } from './FormKitSchema'

/**
 * The default configuration.
 * @public
 */
export { default as defaultConfig, DefaultConfigOptions } from './defaultConfig'

/**
 * The vue specific FormKit core plugin. This is generally required for all
 * vue based FormKit configurations.
 * @public
 */
export { default as bindings } from './bindings'

/**
 * A vue component for rendering icons from the FormKit icon registry
 * @public
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
