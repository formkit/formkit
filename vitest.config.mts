import { defineConfig } from 'vitest/config'
import vueJsx from '@vitejs/plugin-vue-jsx'
/* @ts-expect-error */
import unpluginTransformer from './scripts/transform-pipe.mjs'

export default defineConfig({
  resolve: {
    conditions: ['development'],
  },
  plugins: [
    vueJsx(),
    unpluginTransformer.vite({
      replace: {
        __DEV__: 'true',
      },
      pure: {
        functions: ['createMessage'],
      },
    }),
  ],
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
