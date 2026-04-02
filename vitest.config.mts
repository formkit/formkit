import { defineConfig } from 'vitest/config'
import vueJsx from '@vitejs/plugin-vue-jsx'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const vueJsxInclude = [
  /packages\/vue\/.*\.[tj]sx$/,
  /packages\/addons\/.*\.[tj]sx$/,
  /packages\/nuxt\/.*\.[tj]sx$/,
]

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@formkit/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@formkit/inputs': fileURLToPath(new URL('./packages/inputs/src/index.ts', import.meta.url)),
      '@formkit/utils': fileURLToPath(new URL('./packages/utils/src/index.ts', import.meta.url)),
    },
    conditions: ['development'],
  },
  define: {
    __DEV__: 'false',
  },
  plugins: [react(), vueJsx({ include: vueJsxInclude })],
  test: {
    root: rootDir,
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
