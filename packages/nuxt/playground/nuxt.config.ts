import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@formkit/nuxt'],
  formkit: {
    autoImport: false,
  },
  sourcemap: {
    server: false,
    client: false,
  },
})
