import { defineNuxtPlugin } from '#app'
import { plugin, defaultConfig, FormKitSchema } from '@formkit/vue'
<%= options.importStatement %>

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp
    .use(plugin, <%= options.config %>)
    .component('FormKitSchema', FormKitSchema)
})
