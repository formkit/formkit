import { defineNuxtPlugin } from '#app'
import { plugin, defaultConfig } from '@formkit/vue'
import { resetCount } from '@formkit/core'
<%= options.importStatement %>

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:rendered', () => {
    resetCount()
  })
  nuxtApp.vueApp.use(plugin, <%= options.config %>)
})
