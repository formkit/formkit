import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // singleThread: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
    typecheck: {
      include: ['**/?(*.){test,spec}-d.?(c|m)[jt]s?(x)'],
    },
  },
})
