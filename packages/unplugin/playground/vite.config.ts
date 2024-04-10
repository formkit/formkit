import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Vue from '@vitejs/plugin-vue'
import Unplugin from '../src/vite'

export default defineConfig({
  plugins: [Vue(), Unplugin(), Inspect()],
})
