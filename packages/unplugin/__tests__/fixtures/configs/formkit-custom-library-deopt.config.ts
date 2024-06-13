import { defineFormKitConfig } from '@formkit/vue'
import { rootClasses } from './formkit.theme'
import customLibrary from './plugins/customLibrary'

export default defineFormKitConfig({
  optimize: false,
  plugins: [customLibrary],
  rootClasses,
})
