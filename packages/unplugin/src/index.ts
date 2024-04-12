import cjsTraverse from '@babel/traverse'
import { createUnplugin } from 'unplugin'
import { parse } from '@babel/parser'
import { extend } from '@formkit/utils'
import t from '@babel/template'
import type { UnpluginFactory } from 'unplugin'
import cjsGenerate from '@babel/generator'
import type { Options, Traverse, ComponentUse, Generate } from './types'
import type { ObjectExpression } from '@babel/types'
// import { resolve } from 'pathe'
// import { existsSync } from 'fs'
import { createConfigObject } from './utils/formkit'
import { usedComponents } from './utils/vue'

// The babel/traverse package imports an an object for some reason
// so we need to get the default property and preserve the types.
const traverse: Traverse =
  typeof cjsTraverse === 'function' ? cjsTraverse : (cjsTraverse as any).default

const generate: Generate =
  typeof cjsGenerate === 'function' ? cjsGenerate : (cjsGenerate as any).default

/**
 * The prefix for a virtual module that contains some configuration.
 */
// const FORMKIT_CONFIG_PREFIX = 'virtual:formkit/'

/**
 * Resolve the absolute path to the configuration file.
 * @param configFile - The configuration file to attempt to resolve.
 */
// function _resolveConfig(configFile: string): string | undefined {
//   const exts = ['ts', 'mjs', 'js']
//   const dir = configFile.startsWith('.') ? process.cwd() : ''
//   let paths: string[] = []

//   if (exts.some((ext) => configFile.endsWith(ext))) {
//     // If the config file has an extension, we don't need to try them all.
//     paths = [resolve(dir, configFile)]
//   } else {
//     // If the config file doesn’t have an extension, try them all.
//     paths = exts.map((ext) => resolve(dir, `${configFile}.${ext}`))
//   }
//   return paths.find((path) => existsSync(path))
// }

function configureFormKitComponent(component: ComponentUse): void {
  if (
    !component.path.node.arguments[1] ||
    component.path.node.arguments[1].type !== 'ObjectExpression'
  ) {
    component.path.node.arguments[1] = t.expression.ast`{}` as ObjectExpression
  }
  const props = component.path.node.arguments[1].properties
  props.push({
    type: 'ObjectProperty',
    computed: false,
    shorthand: false,
    key: {
      type: 'Identifier',
      name: '__config__',
    },
    value: createConfigObject(component),
  })
}

export const unpluginFactory: UnpluginFactory<Partial<Options> | undefined> = (
  options = {}
) => {
  const opts = extend(
    {
      components: [
        {
          name: 'FormKit',
          from: '@formkit/vue',
          codeMod: configureFormKitComponent,
        },
      ],
    },
    options ?? {},
    true
  ) as Options
  const HAS_COMPONENTS_RE = new RegExp(
    `(?:${opts.components.map((c) => c.name).join('|')})`
  )
  return {
    name: 'unplugin:formkit',
    // resolveId(id) {
    //   if (id.startsWith(FORMKIT_CONFIG_PREFIX)) {
    //     return '\0' + id
    //   }
    //   return null
    // },
    // load(id) {
    //   if (id === '\0' + FORMKIT_CONFIG_PREFIX) {
    //     const plugin = id.substring(FORMKIT_CONFIG_PREFIX.length + 1)
    //     const configFile = `export default {}`
    //   }
    //   return null
    // },

    // webpack's id filter is outside of loader logic,
    // an additional hook is needed for better perf on webpack
    transformInclude(id) {
      return id.endsWith('.vue')
    },
    // just like rollup transform
    async transform(code) {
      // Quick checks to early return:
      if (!Array.isArray(opts.components)) return null

      // If our component strings are not found at all in this file, we can skip it.
      if (!HAS_COMPONENTS_RE.test(code)) return null

      const ast = parse(code, { sourceType: 'module' })

      // Locate the formkit components. We check for a string like "FormKit"
      // but in setup or resolveComponent but it could be any other string if
      // there is an explicit import of `FormKit` as 'OtherName from `@formkit/vue`
      // package. Detection could be:
      // 1. _resolveComponent('FormKit')
      // 2. _createVNode($setup['FormKit'])
      // 3. _createBlock($setup['FormKit'])
      // 4. _ssrRenderComponent($setup['FormKit'])

      // Order of operations:
      // 0. Locate resolveComponent import and get the import name
      // 1. Check for option.components resolveComponent usages
      //    - If the component is imported, get its import name
      //    - If the component is not imported, inject an import with a unique name
      // 2. Locate createVNode, createBlock, ssrRenderComponent imports
      // 3. Check

      const components = usedComponents(traverse, ast, opts.components, true)
      if (components.length === 0) return null

      for (const component of components) {
        if (component.codeMod) component.codeMod(component)
      }

      const result = generate(ast, { sourceMaps: true }, code)
      return {
        code: result.code,
        map: result.map,
      }
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
