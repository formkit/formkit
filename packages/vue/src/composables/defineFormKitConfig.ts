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
  /**
   * Custom validation rules. See the {@link https://formkit.com/essential/validation | validation docs} for information on how to write your own rules.
   */
  rules: Record<string, FormKitValidationRule>
  /**
   * i18n locales. See the {@link https://formkit.com/essential/internationalization | i18n docs} for more details.
   */
  locales: FormKitLocaleRegistry
  /**
   * Custom inputs. See the {@link https://formkit.com/essential/inputs | input docs} for more details and information on how to write your own inputs.
   */
  inputs: FormKitLibrary
  /**
   * Override the i18n locales on a per-message basis. The structure should be:
   * ```ts
   * {
   *   en: {
   *     validation: {
   *       required: 'This field is super required',
   *     }
   *   }
   * }
   * ```
   */
  messages: Record<string, Partial<FormKitLocale>>
  /**
   * The default locale.
   */
  locale: string
  /**
   * A theme to use for the form.
   */
  theme: string
  /**
   * The URL to load icons from.
   */
  iconLoaderUrl: FormKitIconLoaderUrl
  /**
   * The icon loader to use.
   */
  iconLoader: FormKitIconLoader
  /**
   * A custom set of icons to use. To provide your own simply provide a key-value pair of the icon name and the SVG string.
   * ```ts
   * {
   *   'check': '<svg>...</svg>',
   * }
   * ```
   */
  icons: Record<string, string | undefined>
}

/**
 * Define the configuration options for FormKit. This configuration format
 * is slightly different than the legacy DefaultConfigOptions. It is
 */
export type DefineConfigOptions = {
  /**
   * An object of options to pass to the `createNode()` function whenever a new core node is created.
   */
  nodeOptions?: Partial<FormKitOptions>
  /**
   * An array of plugins to pass to the `createNode()` function whenever a new core node is created.
   */
  plugins?: FormKitPlugin[]
  /**
   * An array of strings, where each is the name of a ui message to localize. {@link https://github.com/formkit/formkit/blob/master/packages/i18n/src/locales/en.ts#L18 | Check any locale’s `ui` object} for the available messages.
   */
  localize?: string[]
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
