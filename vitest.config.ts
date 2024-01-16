import { defineConfig } from 'vitest/config'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { replaceCodePlugin } from 'vite-plugin-replace'

export default defineConfig({
  plugins: [
    vueJsx(),
    replaceCodePlugin({
      replacements: [
        {
          from: '__DEV__',
          to: 'false',
        },
      ],
    }),
  ],
  test: {
    environment: 'jsdom',
    // singleThread: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
    typecheck: {
      include: ['./packages/**/?(*.){test,spec}-d.?(c|m)[jt]s?(x)'],
      exclude: [
        '**/node_modules/**',
        '**/examples/**',
        './packages/nuxt/playground/**.ts',
      ],
    },
  },
})
