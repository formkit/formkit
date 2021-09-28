import * as rules from '@formkit/rules'
import { createValidationPlugin } from '@formkit/validation'
import { createI18nPlugin, en } from '@formkit/i18n'
import { library } from '@formkit/inputs'
import { FormKitVueConfig } from './plugin'

const validation = createValidationPlugin(rules)
const i18n = createI18nPlugin({ en })

const defaultConfig: FormKitVueConfig = {
  alias: 'FormKit',
  nodeOptions: {
    plugins: [i18n, validation],
  },
  library,
}

export default defaultConfig
