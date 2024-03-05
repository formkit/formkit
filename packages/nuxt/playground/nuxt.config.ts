import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['../src/module', '@nuxtjs/tailwindcss'],
  formkit: {
    autoImport: true,
  },
})
