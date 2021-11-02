import { FormKitOptions } from '@formkit/core'
import { extend } from '@formkit/utils'
import * as rules from '@formkit/rules'
import { createValidationPlugin } from '@formkit/validation'
import { createI18nPlugin, en } from '@formkit/i18n'
import { createLibraryPlugin, inputs } from '@formkit/inputs'
import vuePlugin from './corePlugin'

/**
 * The default configuration includes the validation plugin,
 * with all core-available validation rules.
 */
const validation = createValidationPlugin(rules)

/**
 * Includes the i18n plugin with only the english language
 * messages.
 */
const i18n = createI18nPlugin({ en })

/**
 * Create the library of inputs that are generally available. This default
 * config imports all "native" inputs by default, but
 */
const library = createLibraryPlugin(inputs)

/**
 * Default configuration options. Includes all validation rules,
 * en i18n messages.
 * @public
 */
const defaultConfig = (options: FormKitOptions = {}): FormKitOptions =>
  extend(
    {
      plugins: [library, vuePlugin, i18n, validation],
    },
    options || {},
    true
  ) as FormKitOptions

export default defaultConfig
