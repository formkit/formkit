import { createApp } from 'vue'
import { plugin, defaultConfig, createInput } from '@formkit/vue'
import { createIconPlugin, inputIcons, ethereum, visa, eye, eyeClosed } from '@formkit/icons'
import { de, fr } from '@formkit/i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import '@formkit/themes/genesis'
import './assets/styles/main.scss'
import App from './vue/App.vue'
import BasicForm from './vue/examples/BasicForm.vue'
import IconPlugin from './vue/examples/IconPlugin.vue'
import CustomInput from './vue/examples/custom-input/CustomInput.vue'
import CurrencyInput from './vue/examples/custom-input/CurrencyInput.vue'
import FileUpload from './vue/examples/FileUpload.vue'
import GroupInput from './vue/examples/Group.vue'
import TSXExample from './vue/examples/TSXExample.tsx'
import ModifySchema from './vue/examples/ModifySchema.vue'

const myInput = createInput(CurrencyInput)

// Create the Vue application:
const app = createApp(App)

// Configure FormKit:
const config = defaultConfig({
  locales: { de, fr },
  locale: 'en',
  inputs: { foo: myInput },
  config: {
    iconPosition: 'prefix'
  },
  plugins: [createIconPlugin({
    ethereum,
    visa,
    eye,
    eyeClosed,
    customStar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path fill="currentColor" d="M329.6 176H488C498.3 176 507.4 182.5 510.7 192.2C514 201.9 510.8 212.6 502.7 218.9L371.9 320.7L422.9 480.7C426.1 490.7 422.4 501.7 413.7 507.7C405.1 513.7 393.6 513.4 385.3 506.9L256 406.4L126.7 506.9C118.4 513.4 106.9 513.7 98.27 507.7C89.65 501.7 85.94 490.7 89.13 480.7L140.1 320.7L9.267 218.9C1.174 212.6-2.027 201.9 1.3 192.2C4.628 182.5 13.75 176 24 176H182.5L233.1 16.72C236.3 6.764 245.6 0 256 0C266.5 0 275.7 6.764 278.9 16.72L329.6 176z"/></svg>`,
    ...inputIcons
  })]
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
      path: '/icon-plugin',
      component: IconPlugin
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
