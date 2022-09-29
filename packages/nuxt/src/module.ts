import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { defineNuxtModule, addPluginTemplate, createResolver } from '@nuxt/kit'

export interface ModuleOptions {
  defaultConfig: boolean
  configFile?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'FormKit',
    configKey: 'formkit',
    compatibility: {
      nuxt: '^3.0.0-rc.7',
    },
  },
  defaults: {
    defaultConfig: true,
    configFile: undefined,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    nuxt.options.build.transpile.push('@formkit/vue')

    const configPath = await resolver.resolvePath(
      options.configFile || 'formkit.config',
      {
        cwd: nuxt.options.rootDir,
        extensions: ['.ts', '.mjs', '.js'],
      }
    )
    const configFileExists = existsSync(configPath)
    let config = 'defaultConfig'
    let importStatement = ''
    if (!configFileExists && options.configFile) {
      throw new Error(`FormKit configuration was not located at ${configPath}`)
    } else if (configFileExists) {
      importStatement = `import config from '${configPath}'`
      config = options.defaultConfig ? 'defaultConfig(config)' : 'config'
    } else if (!configFileExists && !options.defaultConfig) {
      throw new Error(
        'FormKit defaultConfig was set to false, but not FormKit config file could be found.'
      )
    }

    addPluginTemplate({
      src: await resolver.resolve('runtime/plugin.mjs'),
      filename: 'formkitPlugin.mjs',
      options: { importStatement, config },
    })
  },
})
