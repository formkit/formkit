import { createApp } from 'vue'
import { plugin, defaultConfig, createInput } from '@formkit/vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { de, fr } from '@formkit/i18n'
import '@formkit/themes/dist/genesis/theme.css'
import './assets/styles/main.scss'
import App from './vue/App.vue'
import BasicForm from './vue/examples/BasicForm.vue'
import CustomInput from './vue/examples/custom-input/CustomInput.vue'
import CurrencyInput from './vue/examples/custom-input/CurrencyInput.vue'

const myInput = createInput(CurrencyInput)

// Create the Vue application:
const app = createApp(App)

// Configure FormKit:
const config = defaultConfig({
  locales: { de, fr },
  locale: 'en',
  inputs: { foo: myInput },
})

// Install FormKit:
app.use(plugin, config)

// Create a new router (to navigate the examples)
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/basic-form',
      component: BasicForm,
    },
    {
      path: '/custom-input',
      component: CustomInput,
    },
  ],
})

// Install the router
app.use(router)

// Mount the Vue application
app.mount('#vue-app')
