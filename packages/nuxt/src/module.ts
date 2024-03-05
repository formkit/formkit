import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { resolve } from 'pathe'
import { watch } from 'chokidar'
import {
  defineNuxtModule,
  addPluginTemplate,
  createResolver,
  updateTemplates,
  addComponent,
  addImports,
  addPlugin,
  addBuildPlugin,
} from '@nuxt/kit'
import { createUnplugin } from 'unplugin'
import type { NuxtModule } from '@nuxt/schema'
import { unpluginFactory as unpluginFormKit } from 'unplugin-formkit'

export interface ModuleOptions {
  defaultConfig?: boolean
  configFile?: string
  /**
   * When true FormKit will not install itself globally and will instead inject
   * a `<FormKitLazyProvider>` around components that use FormKit. Additionally
   * when true FormKit enables auto-imports for the following:
   *
   * - `<FormKit>`
   * - `<FormKitProvider>`
   * - `<FormKitMessages>`
   * - `<FormKitSummary>`
   * - `getNode()`
   * - `createInput()`
   * - `setErrors`,
   * - `clearErrors`,
   * - `submitForm`,
   * - `reset`,
   * - `FormKitNode`
   *
   * @experimental
   */
  autoImport?: boolean
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
    autoImport: false,
  },
  async setup(options, nuxt) {
    nuxt.options.build.transpile.push('@formkit/vue')
    if (options.autoImport) {
      useAutoImport(options, nuxt)
    } else {
      useFormKitPlugin(options, nuxt)
    }
  },
})

/**
 * Installs FormKit via lazy loading. This is the preferred method of
 * installation as it allows for a smaller bundle size and better tree shaking.
 */
const useAutoImport = async function installLazy(options, nuxt) {
  addImports([
    {
      from: '@formkit/core',
      name: 'FormKitNode',
      type: true,
    },
    {
      from: '@formkit/vue',
      name: 'createInput',
    },
    {
      from: '@formkit/core',
      name: 'getNode',
    },
    {
      from: '@formkit/core',
      name: 'setErrors',
    },
    {
      from: '@formkit/core',
      name: 'clearErrors',
    },
    {
      from: '@formkit/core',
      name: 'submitForm',
    },
    {
      from: '@formkit/core',
      name: 'reset',
    },
  ])

  addComponent({
    name: 'FormKit',
    export: 'FormKit',
    filePath: '@formkit/vue',
    chunkName: '@formkit/vue',
  })

  addComponent({
    name: 'FormKitProvider',
    export: 'FormKitProvider',
    filePath: '@formkit/vue',
    chunkName: '@formkit/vue',
  })

  addComponent({
    name: 'FormKitMessages',
    export: 'FormKitMessages',
    filePath: '@formkit/vue',
    chunkName: '@formkit/vue',
  })
  addComponent({
    name: 'FormKitSummary',
    export: 'FormKitSummary',
    filePath: '@formkit/vue',
    chunkName: '@formkit/vue',
  })
  const { resolve } = createResolver(import.meta.url)

  const configBase = resolve(
    nuxt.options.rootDir,
    options.configFile || 'formkit.config'
  )

  addPlugin({
    mode: 'server',
    src: resolve('./runtime/formkitSSRPlugin.mjs'),
  })

  addBuildPlugin(createUnplugin(unpluginFormKit.bind({}, {
    defaultConfig: options.defaultConfig,
    configFile: configBase,
  }) as unknown as typeof unpluginFormKit))
} satisfies NuxtModule<ModuleOptions>
/**
 * Installs FormKit via Nuxt plugin. This registers the FormKit plugin globally
 * which is convenient but has the downside of increasing size of the entry
 * bundle. Eventually this mechanism will deprecated in favor of the lazy
 * behavior.
 */
const useFormKitPlugin = async function installNuxtPlugin(options, nuxt) {
  const resolver = createResolver(import.meta.url)

  // Add FormKit typescript types explicitly.
  nuxt.hook('prepare:types', (opts) => {
    opts.references.push({ types: '@formkit/vue' })
  })

  const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
  nuxt.options.build.transpile.push(runtimeDir)

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

      return `import { defineNuxtPlugin } from '#imports'
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
} satisfies NuxtModule<ModuleOptions>

export default module
