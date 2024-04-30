import { defineFormKitConfig } from '@formkit/vue'
import { de } from '@formkit/i18n'

export default defineFormKitConfig({
  optimize: {
    i18n: false,
  },
  locales: {
    de,
  },
})
