import { defineFormKitConfig } from '@formkit/vue'

export default defineFormKitConfig({
  optimize: {
    inputs: {
      optimize: false,
      builtins: false,
    },
  },
})
