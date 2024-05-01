import { defineFormKitConfig } from '@formkit/vue'

export default defineFormKitConfig({
  optimize: true,
  iconLoaderUrl: (iconName: string) =>
    `https://cdn.jsdelivr.net/npm/heroicons/24/outline/${iconName}.svg`,
})
