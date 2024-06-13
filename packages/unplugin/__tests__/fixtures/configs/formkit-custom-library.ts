import { defineFormKitConfig } from '@formkit/vue'
import { rootClasses } from './formkit.theme'
import customLibrary from './plugins/customLibrary'

export default defineFormKitConfig({
  optimize: {
    debug: true,
  },
  plugins: [customLibrary],
  rootClasses,
})
