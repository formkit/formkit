import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// Benchmarks the *built* packages (packages/*/dist), so run `pnpm build`
// (or build the packages you changed) before `pnpm bench`.
const pkg = (name) =>
  fileURLToPath(new URL(`../packages/${name}/dist/index.mjs`, import.meta.url))

const packages = [
  'utils', 'core', 'dev', 'observer', 'validation', 'i18n', 'inputs',
  'rules', 'themes', 'vue',
]

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    alias: Object.fromEntries(packages.map((p) => [`@formkit/${p}`, pkg(p)])),
  },
  define: { __DEV__: 'false' },
  logLevel: 'warn',
  build: { outDir: 'dist', emptyOutDir: true },
})
