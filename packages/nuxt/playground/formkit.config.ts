import { defineFormKitConfig } from '@formkit/vue'

export default defineFormKitConfig(() => {
  // @ts-ignore - needed for vitest typecheck
  const config = useRuntimeConfig()

  return {
    // theme: config.theme,
  }
})
