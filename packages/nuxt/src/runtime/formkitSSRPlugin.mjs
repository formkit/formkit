import { defineNuxtPlugin } from '#app'
import { ssrComplete, resetCount } from '@formkit/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:rendered', () => {
    resetCount()
    ssrComplete(nuxtApp.vueApp)
  })
})
