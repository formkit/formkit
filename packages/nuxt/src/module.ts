import { existsSync } from 'fs'
import { fileURLToPath } from 'url'

import * as formkit from '@formkit/vue'
import { defineNuxtModule, addPluginTemplate, createResolver, extendViteConfig } from '@nuxt/kit'

export interface ModuleOptions {
  autoImports?: {
    /**
     * Prefix to be added before every imports function.
     * False to disable prefix

     * @defaultValue `use`
     */
    prefix?: string
    /**
     * Functions that starts with keywords in this array will be skipped by prefix

    * @defaultValue [`fk`]
     */
    prefixSkip?: string[]
    /**
     * Array of imports to be exluded from auto-imports

    * @defaultValue [`FormKit`, `FormKitSchema`]
     */
    exclude?: string[]
    /**
     * Iterable of string pairs to alias each function

    * @defaultValue []
     */
    alias?: Iterable<[string, string]>
  }

  /**
   * @defaultValue true
   */
  defaultConfig: boolean

  /**
   * @defaultValue undefined
   */
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
    autoImports: {
      prefix: 'fk',
      prefixSkip: ['is'],
      exclude: ['FormKit', 'FormKitSchema'],
      alias: [],
    },
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

    if (options.autoImports) {
      const imports = []
      const prefix = options.autoImports.prefix || ''
      const aliasMap = new Map(options.autoImports.alias)
      const exludes = options.autoImports.exclude

      for (const [name] of Object.entries(formkit)) {
        if (!exludes.includes(name)) {
          const alias = aliasMap.has(name) ? aliasMap.get(name) : name
          const as = (() => {
            const isPrefix = !options.autoImports.prefixSkip.some((key) => alias.startsWith(key)) && prefix
            return isPrefix ? prefix + alias.charAt(0).toUpperCase() + alias.slice(1) : alias;
          })() as string
          imports.push({ name, as })
        }
      }

      extendViteConfig((config) => {
        config.optimizeDeps ||= {}
        config.optimizeDeps.exclude ||= []
        config.optimizeDeps.exclude.push('@formkit/vue')
      })

      nuxt.hook('autoImports:sources', (sources) => {
        if (sources.find(i => i.from === '@formkit/vue'))
          return

        // REmove when Nuxt adds "imports" to types
        // @ts-ignore
        sources.push({ imports, from: '@formkit/vue' })
      })
    }
  },
})

declare module '@nuxt/schema' {
  interface NuxtConfig {
    formkit?: ModuleOptions
  }
  interface NuxtOptions {
    formkit?: ModuleOptions
  }
}
