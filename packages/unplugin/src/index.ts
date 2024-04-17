import { createUnplugin } from 'unplugin'
import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { createOpts } from './utils/config'
import { createTransform } from './hooks/transform'
import { createLoad } from './hooks/load'
import { createResolver } from './hooks/resolveId'

/**
 * The prefix for a virtual module that contains some configuration.
 */
export const FORMKIT_CONFIG_PREFIX = 'virtual:formkit/'

export const unpluginFactory: UnpluginFactory<Partial<Options> | undefined> = (
  options = {}
) => {
  const opts = createOpts(options)

  return {
    name: 'unplugin:formkit',
    resolveId: createResolver(opts),
    load: createLoad(opts),
    // webpack's id filter is outside of loader logic,
    // an additional hook is needed for better perf on webpack
    transformInclude(id) {
      return id.endsWith('.vue')
    },
    // just like rollup transform
    transform: createTransform(opts),
    vite: {
      /**
       * Ensure the order of the plugin is after the vue plugin.
       */
      configResolved(config) {
        if (
          config.plugins.findIndex((plugin) => plugin.name === 'vite:vue') >
          config.plugins.findIndex(
            (plugin) => plugin.name === 'unplugin:formkit'
          )
        ) {
          throw new Error(
            '@formkit/unplugin vite plugin must be loaded after the vue vite plugin.'
          )
        }
      },
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)
