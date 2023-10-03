import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      theme: process.env.FORMKIT_THEME,
    },
  },
  modules: ['../src/module'],
  formkit: {
    autoImport: true,
  },
})
