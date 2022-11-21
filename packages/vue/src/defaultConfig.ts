import type { FormKitOptions, FormKitLibrary } from '@formkit/core'
import { extend } from '@formkit/utils'
import * as defaultRules from '@formkit/rules'
import type { FormKitValidationRule } from '@formkit/validation';
import { createValidationPlugin } from '@formkit/validation'
import type { FormKitLocale, FormKitLocaleRegistry } from '@formkit/i18n';
import { createI18nPlugin, en } from '@formkit/i18n'
import { createLibraryPlugin, inputs as defaultInputs } from '@formkit/inputs'
import type { FormKitIconLoader, FormKitIconLoaderUrl } from '@formkit/themes';
import { createThemePlugin } from '@formkit/themes'
import bindings from './bindings'
import '@formkit/dev'

interface PluginConfigs {
  rules: Record<string, FormKitValidationRule>
  locales: FormKitLocaleRegistry
  inputs: FormKitLibrary
  messages: Record<string, Partial<FormKitLocale>>
  theme: string
  iconLoaderUrl: FormKitIconLoaderUrl
  iconLoader: FormKitIconLoader
  icons: Record<string,string|undefined>
}

/**
 * The allowed options for defaultConfig.
 * @public
 */
export type DefaultConfigOptions = FormKitOptions &
  Partial<PluginConfigs> &
  Record<string, unknown>

/**
 * Default configuration options. Includes all validation rules,
 * en i18n messages.
 * @public
 */
const defaultConfig = (options: DefaultConfigOptions = {}): FormKitOptions => {
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

export default defaultConfig
