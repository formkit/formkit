import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import { parse } from '@babel/parser'
import type { Node } from '@babel/parser'
// import generate from '@babel/generator'
import type { Options } from './types'
import { resolve } from 'pathe'
import { existsSync } from 'fs'

const FORMKIT_CONFIG_PREFIX = 'virtual:formkit/'

/**
 * A cheap test to see if the code contains any hint of FormKit.
 */
const CONTAINS_FORMKIT_RE = /[fF]orm-?[kK]it/

/**
 * Resolve the absolute path to the configuration file.
 * @param configFile - The configuration file to attempt to resolve.
 */
function _resolveConfig(configFile: string): string | undefined {
  const exts = ['ts', 'mjs', 'js']
  const dir = configFile.startsWith('.') ? process.cwd() : ''
  let paths: string[] = []

  if (exts.some((ext) => configFile.endsWith(ext))) {
    // If the config file has an extension, we don't need to try them all.
    paths = [resolve(dir, configFile)]
  } else {
    // If the config file doesn’t have an extension, try them all.
    paths = exts.map((ext) => resolve(dir, `${configFile}.${ext}`))
  }
  return paths.find((path) => existsSync(path))
}

function determineComponentType(code: string) {}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options = {
    configFile: './formkit.config',
    defaultConfig: true,
  }
) => {
  return {
    name: 'unplugin:formkit',
    resolveId(id) {
      if (id.startsWith(FORMKIT_CONFIG_PREFIX)) {
        return '\0' + id
      }
      return null
    },
    load(id) {
      if (id === '\0' + FORMKIT_CONFIG_PREFIX) {
        const plugin = id.substring(FORMKIT_CONFIG_PREFIX.length + 1)
        const configFile = `export default {}`
      }
      return null
    },

    // webpack's id filter is outside of loader logic,
    // an additional hook is needed for better perf on webpack
    transformInclude(id) {
      return id.endsWith('.vue')
    },
    // just like rollup transform
    async transform(code) {
      if (!CONTAINS_FORMKIT_RE.test(code)) return null
      // Locate the formkit components. We check for a string like "FormKit"
      // but in setup or resolveComponent but it could be any other string if
      // there is an explicit import of `FormKit` as 'OtherName from `@formkit/vue`
      // package. Detection could be:
      // 1. _resolveComponent('FormKit')
      // 2. _createVNode($setup['FormKit'])
      // 3. _createBlock($setup['FormKit'])
      // 4. _ssrRenderComponent($setup['FormKit'])
      const componentType = determineComponentType(code)

      // Test if the given code is a likely candidate for FormKit usage.
      // if (id.endsWith('.vue') && CONTAINS_FORMKIT_RE.test(code)) {
      //   return injectProviderComponent(injectProviderImport(code), id)
      // }
      return null
    },
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
