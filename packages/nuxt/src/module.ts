import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineNuxtModule, addPluginTemplate } from '@nuxt/kit'

export interface ModuleOptions {
  defaultConfig: boolean
  configFile?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'FormKit',
    configKey: 'formkit',
  },
  defaults: {
    defaultConfig: true,
    configFile: undefined,
  },
  setup(options, nuxt) {
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    addPluginTemplate({
      src: resolve(runtimeDir, 'plugin.mjs'),
      filename: 'formkitPlugin.mjs',
      options,
    })
  },
})
