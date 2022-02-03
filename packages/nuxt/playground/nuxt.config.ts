import { defineNuxtConfig } from 'nuxt3'
import FormKitModule from '../'

export default defineNuxtConfig({
  modules: [FormKitModule],
  meta: {
    script: [{ src: 'https://unpkg.com/tailwindcss-jit-cdn' }],
  },
})
