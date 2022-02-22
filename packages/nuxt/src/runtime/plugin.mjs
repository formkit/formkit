import { defineNuxtPlugin } from '#app'
import { plugin, defaultConfig } from '@formkit/vue'
<%= options.importStatement %>

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(plugin, <%= options.config %>)
})
