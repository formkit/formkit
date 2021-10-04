/**
 * The useInput composable.
 * @public
 */
export { useInput } from './composables/useInput'

/**
 * The plugin and plugin types.
 * @public
 */
export * from './plugin'

/**
 * The root FormKit component.
 * @public
 */
export { default as FormKit } from './FormKit'

/**
 * The FormKitSchema component.
 * @public
 */
export { FormKitSchema } from './FormKitSchema'

/**
 * The default configuration.
 * @public
 */
export { default as defaultConfig } from './defaultConfig'

/**
 * Foodbar definition.
 * @public
 */
export interface FooBar {
  title: string
}
