import * as rules from '@formkit/rules'
import { createValidationPlugin } from '@formkit/validation'
import { createI18nPlugin, en } from '@formkit/i18n'
import { library } from '@formkit/inputs'
import { FormKitVueConfig } from './plugin'
import corePlugin from './corePlugin'

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
 * Default configuration options. Includes all validation rules,
 * en i18n messages.
 * @public
 */
const defaultConfig: FormKitVueConfig = {
  alias: 'FormKit',
  nodeOptions: {
    plugins: [corePlugin, i18n, validation],
  },
  library,
}

export default defaultConfig
