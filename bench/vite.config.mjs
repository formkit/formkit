import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// Benchmarks the *built* packages (packages/*/dist), so run `pnpm build`
// (or build the packages you changed) before `pnpm bench`.
const pkg = (name) =>
  fileURLToPath(new URL(`../packages/${name}/dist/index.mjs`, import.meta.url))

const packages = [
  'utils', 'core', 'dev', 'observer', 'validation', 'i18n', 'inputs',
  'rules', 'themes', 'vue', 'react',
]

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    alias: Object.fromEntries(packages.map((p) => [`@formkit/${p}`, pkg(p)])),
  },
  define: { __DEV__: 'false', 'process.env.NODE_ENV': JSON.stringify('production') },
  logLevel: 'warn',
  // BENCH_MINIFY=0 keeps function names readable in `pnpm bench profile`.
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: process.env.BENCH_MINIFY !== '0',
  },
})
