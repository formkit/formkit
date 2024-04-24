import { defineFormKitConfig } from '@formkit/vue'
import { de } from '@formkit/i18n'
/* @ts-expect-error - this is not a real import */
import { fr } from './my-custom-locale'

export default defineFormKitConfig({
  locales: { de, fr },
  messages: {
    de: {
      validation: {
        required: 'Dieses Feld ist erforderlich',
      },
    },
  },
})
