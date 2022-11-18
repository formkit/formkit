import { defineNuxtConfig } from 'nuxt/config'
import FormKitModule from '../'

export default defineNuxtConfig({
  modules: [FormKitModule],
  app: {
    head: {
      script: [{ src: 'https://unpkg.com/tailwindcss-jit-cdn' }],
    }
  },
})
