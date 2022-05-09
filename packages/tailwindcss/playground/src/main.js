import { createApp } from 'vue'
import App from './App.vue'
import { generateClasses } from '@formkit/themes'
import { plugin, defaultConfig } from '@formkit/vue'
import theme from './theme.js'
import '../dist/index.css'

createApp(App)
  .use(
    plugin,
    defaultConfig({
      config: {
        classes: generateClasses(theme),
      },
    })
  )
  .mount('#app')
