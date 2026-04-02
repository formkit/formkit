import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const playgroundRoot = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(playgroundRoot, '..')

export default defineConfig({
  root: playgroundRoot,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@formkit/react': resolve(packageRoot, 'src/index.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: {
      allow: [packageRoot],
    },
  },
  build: {
    minify: false,
  },
})
