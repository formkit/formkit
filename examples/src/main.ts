import { createApp } from 'vue'
import App from './Examples.vue'
import { formKitPlugin } from '../../packages/vue/src/index'

const app = createApp(App)
app.use(formKitPlugin)
app.mount('#app')
