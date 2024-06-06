import { defineFormKitConfig } from '@formkit/vue'
import { rootClasses } from './formkit.theme'
export default defineFormKitConfig({
  optimize: {
    debug: true,
  },
  rootClasses,
})
