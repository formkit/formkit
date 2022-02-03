import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineNuxtModule, addPluginTemplate } from '@nuxt/kit'
import fs from 'fs'

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
    const rootPath = nuxt.options.srcDir + '/'
    let configPath: undefined | string
    if (options.configFile) {
      configPath = rootPath + options.configFile
      if (!fs.existsSync(configPath)) {
        throw new Error(
          `FormKit configuration was not located at ${configPath}`
        )
      }
      options.configFile = configPath
    } else {
      const extensions = ['.ts', '.mjs', '.js']
      for (const ext of extensions) {
        configPath = rootPath + 'formkit.config' + ext
        if (fs.existsSync(configPath)) {
          options.configFile = configPath
          break
        }
      }
    }

    addPluginTemplate({
      src: resolve(runtimeDir, 'plugin.mjs'),
      filename: 'formkitPlugin.mjs',
      options,
    })
  },
})
