import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['../src/module'],
  app: {
    head: {
      script: [{ src: 'https://unpkg.com/tailwindcss-jit-cdn' }],
    },
  },
})
