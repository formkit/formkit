import { defineFormKitConfig } from '@formkit/vue'
import { rootClasses } from './formkit.theme'
export default defineFormKitConfig({
  optimize: {
    theme: false,
  },
  rootClasses,
})
