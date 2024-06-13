import { createInput, defineFormKitConfig } from '@formkit/vue'
import { createMultiStepPlugin } from '@formkit/addons'
import { genesisIcons } from '@formkit/icons'
import '@formkit/addons/css/multistep.css'
import { rootClasses } from './formkit.theme'

export default defineFormKitConfig({
  optimize: {
    debug: true,
  },
  plugins: [createMultiStepPlugin()],
  icons: { ...genesisIcons },
  rootClasses,
})
