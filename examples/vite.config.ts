import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: './examples',
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "/src/assets/styles/griddle-overrides.scss";
          @import "@braid/griddle/scss/griddle.scss";
        `,
      },
    },
  },
})
