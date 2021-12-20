import { FormKitOptions, FormKitLibrary } from '@formkit/core'
import { extend } from '@formkit/utils'
import * as defaultRules from '@formkit/rules'
import {
  createValidationPlugin,
  FormKitValidationRule,
} from '@formkit/validation'
import { createI18nPlugin, FormKitLocaleRegistry, en } from '@formkit/i18n'
import { createLibraryPlugin, inputs as defaultInputs } from '@formkit/inputs'
import vuePlugin from './corePlugin'

interface PluginConfigs {
  rules: Record<string, FormKitValidationRule>
  locales: FormKitLocaleRegistry
  inputs: FormKitLibrary
}

/**
 * Default configuration options. Includes all validation rules,
 * en i18n messages.
 * @public
 */
const defaultConfig = (
  options: FormKitOptions & Partial<PluginConfigs> = {}
): FormKitOptions => {
  const { rules = {}, locales = {}, inputs = {}, ...nodeOptions } = options
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
  const i18n = createI18nPlugin({ en, ...(locales || {}) })

  /**
   * Create the library of inputs that are generally available. This default
   * config imports all "native" inputs by default, but
   */
  const library = createLibraryPlugin(defaultInputs, inputs)

  return extend(
    {
      plugins: [library, vuePlugin, i18n, validation],
    },
    nodeOptions || {},
    true
  ) as FormKitOptions
}

export default defaultConfig
