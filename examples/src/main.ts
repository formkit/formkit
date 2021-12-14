import { createApp } from 'vue'
import { plugin, defaultConfig } from '../../packages/vue/src/index'
import '../../packages/themes/src/genesis/index'
import vueApp from './vue/Examples.vue'
import { de, fr } from '@formkit/i18n'

const app = createApp(vueApp).use(
  plugin,
  defaultConfig({
    locales: { de, fr },
    locale: 'en',
  })
)
app.mount('#vue-app')
