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
 * A special watcher for Vue that reports the location of a deep mutation.
 */
export { isObserver } from './composables/mutationObserver'

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
 * Export the reset count explicitly
 */
export {
  resetCount,
  errorHandler,
  setErrors,
  submitForm,
  reset,
} from '@formkit/core'
