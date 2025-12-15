import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  root: './examples',
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => {
            return tag.startsWith('custom-')
          },
        },
      },
    }),
    vueJsx(),
  ],
  build: {
    minify: false,
  },
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
