import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@formkit/nuxt', '@nuxtjs/tailwindcss'],
  formkit: {
    autoImport: true,
  },
})
