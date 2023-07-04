import { defineFormKitConfig } from '@formkit/vue'

export default defineFormKitConfig(() => {
  const config = useRuntimeConfig()

  return {
    theme: config.theme,
  }
})
