import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

console.log('path', resolve(__dirname, '../packages/vue/src/'))

export default defineConfig({
  root: './examples',
  plugins: [vue()],
  resolve: {
    alias: {
      '@components': resolve(__dirname, '../packages/vue/src/components'),
    },
  },
})
