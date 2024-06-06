import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Vue from '@vitejs/plugin-vue'
import Unplugin from '../src/vite'
import UnpluginFileUrl from 'unplugin-file-url/vite'

export default defineConfig({
  build: {
    minify: true,
  },
  plugins: [Vue(), Unplugin(), Inspect(), UnpluginFileUrl()],
})
