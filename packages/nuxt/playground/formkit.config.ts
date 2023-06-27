import { defineFormKitConfig } from '@formkit/vue'

export default defineFormKitConfig({
  theme: 'genesis',
  // expecation is that useRuntimeConfig will be available
  // when our defineFormKitConfig return function is called
  test: useRuntimeConfig().test,
})
