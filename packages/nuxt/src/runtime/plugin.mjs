import { defineNuxtPlugin } from '#app'
import { plugin, defaultConfig, ssrComplete } from '@formkit/vue'
import { resetCount } from '@formkit/core'
<%= options.importStatement %>

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:rendered', (renderContext) => {
    resetCount()
    ssrComplete(nuxtApp.vueApp)
  })
  nuxtApp.vueApp.use(plugin, <%= options.config %>)

})
