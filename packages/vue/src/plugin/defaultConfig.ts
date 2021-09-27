import * as rules from '@formkit/rules'
import { FormKitPlugin, FormKitLibrary } from '@formkit/core'
import { createValidationPlugin } from '@formkit/validation'
import { createI18nPlugin, en } from '@formkit/i18n'

const validation = createValidationPlugin(rules)
const i18n = createI18nPlugin({ en })

export interface FormKitVueOptions {
  library: FormKitLibrary
  plugins: FormKitPlugin[]
  FormKit: string
}

export default {
  root: 'FormKit',
  plugins: [validation, i18n],
  library: {
    text: {
      type: 'input',
      schema: [
        {
          $el: 'label',
          children: '$label',
        },
        {
          $el: 'input',
        },
      ],
    },
  },
}
