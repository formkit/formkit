import type { FormKitOptions } from '@formkit/core'
import { extend } from '@formkit/utils'
import * as defaultRules from '@formkit/rules'
import { createValidationPlugin } from '@formkit/validation'
import type { FormKitLocaleRegistry } from '@formkit/i18n'
import { createI18nPlugin } from '@formkit/i18n/i18n'
import en from '@formkit/i18n/locales/en'
import { createLibraryPlugin, inputs as defaultInputs } from '@formkit/inputs'

import { createThemePlugin } from '@formkit/themes'
import bindings from './bindings'
import { register as decodeErrors } from '@formkit/dev'
import type { PluginConfigs } from './index'

/**
 * Legacy configuration options for defaultConfig.
 *
 * @deprecated - This type is deprecated and will be removed in the next
 * major version of FormKit. If you nest the `config` property of your options
 * object inside a `nodeOptions` key it will be automatically migrated to the
 * new optimized format:
 *
 * ```js
 * export default defineFormKitConfig({
 *  rules: {
 *    // custom rules here
 *  },
 *  inputs: {
 *    // custom inputs here
 *  },
 *  nodeOptions: {
 *    config: {
 *      // node config here
 *    }
 *  }
 * })
 * ```
 *
 * @public
 */
export type DefaultConfigOptions = FormKitOptions &
  Partial<PluginConfigs> &
  Record<string, unknown>

/**
 * Default configuration options. Includes all validation rules,
 * en i18n messages.
 *
 * @deprecated - defaultConfig is no longer the recommended way to configure
 * FormKit globally. Read the new configuration documentation for details:
 * {@link https://formkit.dev/docs/configuration}
 *
 * @public
 */
export const defaultConfig = (
  options: DefaultConfigOptions = {}
): FormKitOptions => {
  decodeErrors()
  const {
    rules = {},
    locales = {},
    inputs = {},
    messages = {},
    locale = undefined,
    theme = undefined,
    iconLoaderUrl = undefined,
    iconLoader = undefined,
    icons = {},
    ...nodeOptions
  } = options
  /**
   * The default configuration includes the validation plugin,
   * with all core-available validation rules.
   */
  const validation = createValidationPlugin({
    ...defaultRules,
    ...(rules || {}),
  })

  /**
   * Includes the i18n plugin with only the english language
   * messages.
   */
  const i18n = createI18nPlugin(
    extend({ en, ...(locales || {}) }, messages) as FormKitLocaleRegistry
  )

  /**
   * Create the library of inputs that are generally available. This default
   * config imports all "native" inputs by default, but
   */
  const library = createLibraryPlugin(defaultInputs, inputs)

  /**
   * Create the theme plugin for the user provided theme
   */
  const themePlugin = createThemePlugin(theme, icons, iconLoaderUrl, iconLoader)

  return extend(
    {
      plugins: [library, themePlugin, bindings, i18n, validation],
      ...(!locale ? {} : { config: { locale } }),
    },
    nodeOptions || {},
    true
  ) as FormKitOptions
}
