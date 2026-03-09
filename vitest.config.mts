import { defineConfig } from 'vitest/config'
import vueJsx from '@vitejs/plugin-vue-jsx'
import react from '@vitejs/plugin-react'

const vueJsxInclude = [
  /packages\/vue\/.*\.[tj]sx$/,
  /packages\/addons\/.*\.[tj]sx$/,
  /packages\/nuxt\/.*\.[tj]sx$/,
]

export default defineConfig({
  resolve: {
    conditions: ['development'],
  },
  define: {
    __DEV__: 'false',
  },
  plugins: [react(), vueJsx({ include: vueJsxInclude })],
  test: {
    environment: 'jsdom',
    retry: 2,
    // singleThread: true,
    exclude: [
      '**/node_modules/**',
      '**/e2e/**',
      './packages/nuxt/playground/**',
    ],
    typecheck: {
      ignoreSourceErrors: true,
      include: ['./packages/**/?(*.){test,spec}-d.?(c|m)[jt]s?(x)'],
      exclude: [
        '**/node_modules/**',
        '**/examples/**',
        './packages/nuxt/playground/**.ts',
      ],
    },
  },
})
