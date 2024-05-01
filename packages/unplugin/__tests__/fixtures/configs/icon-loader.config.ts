import { defineFormKitConfig } from '@formkit/vue'

export default defineFormKitConfig({
  optimize: true,
  iconLoader: async (iconName): Promise<string | undefined> => {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/heroicons/24/outline/${iconName}.svg`
    )
    if (res.ok) {
      const icon = await res.text()
      if (icon.startsWith('<svg')) {
        return icon
      }
    }
    return undefined
  },
})
