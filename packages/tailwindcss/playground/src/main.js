import { createApp } from 'vue'
import App from './App.vue'
import { generateClasses } from '@formkit/core'
import { plugin, defaultConfig } from '../../../vue/dist'
import theme from './theme.js'
import '../dist/index.css'

createApp(App)
  .use(plugin, defaultConfig({
    config: {
      classes: generateClasses(theme)
    }
  }))
  .mount('#app')
