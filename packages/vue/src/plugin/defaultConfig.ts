import * as rules from '@formkit/rules'
import { FormKitPlugin } from '@formkit/core'
import { createValidationPlugin } from '@formkit/validation'
import { createI18nPlugin, en } from '@formkit/i18n'

const validation = createValidationPlugin(rules)
const i18n = createI18nPlugin({ en })

export interface FormKitVueOptions {
  // library: FormKitLibrary,
  // schemaComponents: FormKitStackComponents,
  plugins: FormKitPlugin[]
  FormKit: string
}

export default {
  root: 'FormKit',
  plugins: [validation, i18n],
  // library: {
  // }
}
