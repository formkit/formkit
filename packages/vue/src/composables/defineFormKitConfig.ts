import type {
  FormKitOptions,
  FormKitLibrary,
  FormKitPlugin,
  FormKitConfig,
} from '@formkit/core'
import type { DefaultConfigOptions } from '../index'
import type { FormKitValidationRule } from '@formkit/validation'
import type { FormKitIconLoader, FormKitIconLoaderUrl } from '@formkit/themes'
import type { FormKitLocale, FormKitLocaleRegistry } from '@formkit/i18n'

/**
 * Configuration for plugins
 *
 * @public
 */
export interface PluginConfigs {
  rules: Record<string, FormKitValidationRule>
  locales: FormKitLocaleRegistry
  inputs: FormKitLibrary
  messages: Record<string, Partial<FormKitLocale>>
  locale: string
  theme: string
  iconLoaderUrl: FormKitIconLoaderUrl
  iconLoader: FormKitIconLoader
  icons: Record<string, string | undefined>
}

/**
 * Define the configuration options for FormKit. This configuration format
 * is slightly different than the legacy DefaultConfigOptions. It is
 */
export type DefineConfigOptions = {
  nodeOptions?: Partial<FormKitOptions>
  plugins: FormKitPlugin[]
} & Partial<PluginConfigs>

/**
 * @deprecated - Using DefaultConfigOptions is no longer the recommended way to
 * configure FormKit globally. Consider using DefineConfigOptions instead. This
 * only requires moving the `config` property inside a `nodeOptions` key.
 *
 * ```ts
 * defineFormKitConfig({
 *   rules: {
 *     // custom rules here
 *   },
 *   inputs: {
 *     // custom inputs here
 *   },
 *   nodeOptions: {
 *     config: {
 *       // node config here
 *     }
 *   }
 * })
 * ```
 */
export type LegacyDefaultConfigOptions = Omit<
  DefaultConfigOptions,
  'config'
> & { config: Partial<FormKitConfig> }

/**
 * @deprecated - Using a function inside defineFormKitConfig is no longer
 * the recommended way to configure FormKit globally. Continuing to a function
 * will not allow your FormKit’s build tooling to optimize your configuration.
 */
export type FunctionalConfigOptions = () => DefaultConfigOptions

/**
 * Define the global configuration options for FormKit. In order to leverage
 * FormKit’s automatic configuration optimization ensure everything in this
 * object can be statically analyzed. For example, avoid spreading (...options)
 * or using functions.
 * @param config - The configuration options for FormKit.
 */
export function defineFormKitConfig(
  config: DefineConfigOptions
): () => DefineConfigOptions
/**
 * @deprecated - Using DefaultConfigOptions is no longer the recommended way to
 * configure FormKit globally. Consider using DefineConfigOptions instead. This
 * only requires moving the `config` property inside a `nodeOptions` key.
 *
 * ```ts
 * defineFormKitConfig({
 *   rules: {
 *     // custom rules here
 *   },
 *   inputs: {
 *     // custom inputs here
 *   },
 *   nodeOptions: {
 *     config: {
 *       // node config here
 *     }
 *   }
 * })
 * ```
 */
export function defineFormKitConfig(
  config: LegacyDefaultConfigOptions
): () => LegacyDefaultConfigOptions
/**
 * @deprecated - Using a function inside defineFormKitConfig is no longer
 * the recommended way to configure FormKit globally. Continuing to a function
 * will not allow your FormKit’s build tooling to optimize your configuration.
 */
export function defineFormKitConfig(
  config: FunctionalConfigOptions
): () => DefaultConfigOptions
export function defineFormKitConfig(
  config:
    | DefineConfigOptions
    | FunctionalConfigOptions
    | LegacyDefaultConfigOptions
) {
  return () => (typeof config === 'function' ? config() : config)
}
