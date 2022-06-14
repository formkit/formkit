import { createApp } from 'vue'
import { plugin, defaultConfig, createInput } from '@formkit/vue'
import { de, fr } from '@formkit/i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import './assets/styles/main.scss'
import App from './vue/App.vue'
import BasicForm from './vue/examples/BasicForm.vue'
import ThemePlugin from './vue/examples/ThemePlugin.vue'
import CustomInput from './vue/examples/custom-input/CustomInput.vue'
import CurrencyInput from './vue/examples/custom-input/CurrencyInput.vue'
import FileUpload from './vue/examples/FileUpload.vue'
import GroupInput from './vue/examples/Group.vue'
import TSXExample from './vue/examples/TSXExample.tsx'
import ModifySchema from './vue/examples/ModifySchema.vue'
import { createAutoAnimatePlugin } from '@formkit/addons'
import '@formkit/themes/genesis'

const myInput = createInput(CurrencyInput)

// Create the Vue application:
const app = createApp(App)

// Configure FormKit:
const config = defaultConfig({
  locales: { de, fr },
  locale: 'en',
  icons: {
    close: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 16"><path d="M10,12.5c-.13,0-.26-.05-.35-.15L1.65,4.35c-.2-.2-.2-.51,0-.71,.2-.2,.51-.2,.71,0L10.35,11.65c.2,.2,.2,.51,0,.71-.1,.1-.23,.15-.35,.15Z" fill="currentColor"/><path d="M2,12.5c-.13,0-.26-.05-.35-.15-.2-.2-.2-.51,0-.71L9.65,3.65c.2-.2,.51-.2,.71,0,.2,.2,.2,.51,0,.71L2.35,12.35c-.1,.1-.23,.15-.35,.15Z" fill="currentColor"/></svg>'
  },
  inputs: { foo: myInput },
  plugins: [createAutoAnimatePlugin()],
})

// Install FormKit:
app.use(plugin, config)

// Create a new router (to navigate the examples)
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: BasicForm,
    },
    {
      path: '/basic-form',
      component: BasicForm,
    },
    {
      path: '/theme-plugin',
      component: ThemePlugin,
    },
    {
      path: '/custom-input',
      component: CustomInput,
    },
    {
      path: '/file-upload',
      component: FileUpload,
    },
    {
      path: '/group',
      component: GroupInput,
    },
    {
      path: '/tsx',
      component: TSXExample,
    },
    {
      path: '/plugin-schema',
      component: ModifySchema,
    },
  ],
})

// Install the router
app.use(router)

// Mount the Vue application
app.mount('#vue-app')
