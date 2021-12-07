import { createApp } from 'vue'
import { plugin, defaultConfig } from '../../packages/vue/src/index'
import '../../packages/themes/src/genesis/index'
import vueApp from './vue/Examples.vue'

const app = createApp(vueApp).use(
  plugin,
  defaultConfig({
    config: {
      rootClasses(key, node) {
        return {
          [`formkit-${key}`]: true,
          'has-errors': node.ledger.value('blocking'),
        }
      },
    },
  })
)
app.mount('#vue-app')
