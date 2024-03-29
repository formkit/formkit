import { defineConfig } from 'vitest/config'
import vueJsx from '@vitejs/plugin-vue-jsx'
/* @ts-expect-error */
import unpluginTransformer from './scripts/transform-pipe.mjs'
import UnpluginFileUrl from 'unplugin-file-url/vite'

export default defineConfig({
  resolve: {
    conditions: ['development'],
    alias: [{ find: 'file://', replacement: '' }],
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
    UnpluginFileUrl(),
  ],
  test: {
    forceRerunTriggers: [
      '**/package.json/**',
      '**/vitest.config.*/**',
      '**/vite.config.*/**',
      '**/packages/**',
    ],
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
