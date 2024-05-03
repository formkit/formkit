import { defineFormKitConfig } from '@formkit/vue'
import { close } from '@formkit/icons'
import { materialIconLoader } from '@formkit/inputs'

export default defineFormKitConfig({
  optimize: false,
  theme: 'genesis',
  icons: {
    close,
    fastForward:
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><path fill="currentColor" d="M248.67 114.66L160.48 58.5A15.91 15.91 0 0 0 136 71.84v37.3L56.48 58.5A15.91 15.91 0 0 0 32 71.84v112.32a15.92 15.92 0 0 0 24.48 13.34L136 146.86v37.3a15.92 15.92 0 0 0 24.48 13.34l88.19-56.16a15.8 15.8 0 0 0 0-26.68M48 183.94V72.07L135.82 128Zm104 0V72.07L239.82 128Z"/></svg>',
  },
  iconLoaderUrl: (iconName: string) => `http://google.com/icons/${iconName}`,
  iconLoader: materialIconLoader(),
})
