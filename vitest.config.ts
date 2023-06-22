import { defineConfig } from 'vitest/config'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vueJsx()],
  test: {
    environment: 'jsdom',
    // singleThread: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
    typecheck: {
      exclude: ['**/node_modules/**', '**/examples/**'],
      include: ['./packages/**/?(*.){test,spec}-d.?(c|m)[jt]s?(x)'],
    },
  },
})
