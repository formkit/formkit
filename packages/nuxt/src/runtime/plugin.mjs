import { defineNuxtPlugin } from '#app'
import { plugin, defaultConfig } from '@formkit/vue'
<% if (options.configFile) { %>
import config from '<%= options.configFile %>'
<% } %>


export default defineNuxtPlugin((nuxtApp) => {
  <% if (options.defaultConfig) { %>
  nuxtApp.vueApp.use(plugin, defaultConfig<%= options.configFile ? '(config)' : '' %>)
  <% } else if (options.configFile) { %>
  nuxtApp.vueApp.use(plugin, config)
  <% } else { %>
  throw new Error('@formkit/nuxt — defaultConfig is set to false but not configFile option is defined.')
  <% } %>
})
