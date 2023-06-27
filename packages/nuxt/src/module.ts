import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { NuxtModule } from '@nuxt/schema'
import { resolve } from 'pathe'
import { watch } from 'chokidar'
import {
  defineNuxtModule,
  addPluginTemplate,
  createResolver,
  updateTemplates,
} from '@nuxt/kit'

export interface ModuleOptions {
  defaultConfig: boolean
  configFile?: string
}

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'FormKit',
    configKey: 'formkit',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  defaults: {
    defaultConfig: true,
    configFile: undefined,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add FormKit typescript types explicitly.
    nuxt.hook('prepare:types', (opts) => {
      opts.references.push({ types: '@formkit/vue' })
    })

    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    nuxt.options.build.transpile.push('@formkit/vue')

    const configBase = resolve(
      nuxt.options.rootDir,
      options.configFile || 'formkit.config'
    )

    if (nuxt.options.dev) {
      const watcher = watch([`${configBase}.{ts,mjs,js}`, configBase])
      watcher.on('all', (event) => {
        if (event === 'add' || event === 'unlink') {
          updateTemplates({
            filter: (template) => template.filename === 'formkitPlugin.mjs',
          })
        }
      })
      nuxt.hook('close', () => {
        watcher.close()
      })
    }

    addPluginTemplate({
      async getContents() {
        const configPath = await resolver.resolvePath(configBase)
        const configPathExists = existsSync(configPath)
        if (!configPathExists && options.configFile) {
          throw new Error(
            `FormKit configuration was not located at ${configPath}`
          )
        } else if (!configPathExists && !options.defaultConfig) {
          throw new Error(
            'FormKit defaultConfig was set to false, but no FormKit config file could be found.'
          )
        }

        return `import { defineNuxtPlugin } from '#app'
        import { plugin, defaultConfig, ssrComplete } from '@formkit/vue'
        import { resetCount } from '@formkit/core'

        ${configPathExists ? `import importedConfig from '${configPath}'` : ''}

        export default defineNuxtPlugin((nuxtApp) => {
          const config = ${
            configPathExists
              ? `defaultConfig(typeof importedConfig === 'function' ? importedConfig() : importedConfig)`
              : `defaultConfig`
          }
          nuxtApp.hook('app:rendered', (renderContext) => {
            resetCount()
            ssrComplete(nuxtApp.vueApp)
          })
          nuxtApp.vueApp.use(plugin, config)

        })
        `
      },
      filename: 'formkitPlugin.mjs',
    })
  },
})

export default module
