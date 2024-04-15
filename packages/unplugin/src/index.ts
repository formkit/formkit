import cjsTraverse from '@babel/traverse'
import { createUnplugin } from 'unplugin'
import * as parser from '@babel/parser'
import { extend } from '@formkit/utils'
import t from '@babel/template'
import type { UnpluginFactory } from 'unplugin'
// import cjsGenerate from '@babel/generator'
import type { Options, Traverse, ComponentUse } from './types'
import type { ObjectExpression, File } from '@babel/types'
import { print, parse } from 'recast'
import { createConfigObject, createInputConfig } from './utils/formkit'
import { usedComponents } from './utils/vue'
import { resolve } from 'pathe'
import { existsSync, readFileSync } from 'fs'

// The babel/traverse package imports an an object for some reason
// so we need to get the default property and preserve the types.
const traverse: Traverse =
  typeof cjsTraverse === 'function' ? cjsTraverse : (cjsTraverse as any).default

// const generate: Generate =
//   typeof cjsGenerate === 'function' ? cjsGenerate : (cjsGenerate as any).default

/**
 * The prefix for a virtual module that contains some configuration.
 */
const FORMKIT_CONFIG_PREFIX = 'virtual:formkit/'

/**
 * Resolve the absolute path to the configuration file.
 * @param configFile - The configuration file to attempt to resolve.
 */
function resolveConfig(configFile: string): string | undefined {
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

  const configPath = resolveConfig(opts.configFile ?? 'formkit.config')

  let configAst: File | undefined
  if (configPath && existsSync(configPath)) {
    const configSource = readFileSync(configPath, { encoding: 'utf8' })
    configAst = parse(configSource, { parser }) as File
  }

  const HAS_COMPONENTS_RE = new RegExp(
    `(?:${opts.components.map((c) => c.name).join('|')})`
  )
  return {
    name: 'unplugin:formkit',
    resolveId(id) {
      if (id.startsWith(FORMKIT_CONFIG_PREFIX)) {
        return '\0' + id
      }
      return null
    },
    load(id) {
      if (id.startsWith('\0' + FORMKIT_CONFIG_PREFIX)) {
        const [plugin, ...args] = id
          .substring(FORMKIT_CONFIG_PREFIX.length + 1)
          .split(':')
        if (plugin === 'inputs') {
          return createInputConfig(traverse, configAst as File, ...args)
        }
        if (plugin === 'library') {
          return `const library = () => {};
          library.library = () => {}
          export { library }`
        }
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
      // Quick checks to early return:
      if (!Array.isArray(opts.components)) return null

      // If our component strings are not found at all in this file, we can skip it.
      if (!HAS_COMPONENTS_RE.test(code)) return null

      const ast = parse(code, { parser }) as File
      const components = usedComponents(traverse, ast, opts.components, true)
      if (components.length === 0) return null
      for (const component of components) {
        if (component.codeMod) component.codeMod(component)
      }
      // const result = generate(ast, { sourceMaps: true }, code)
      const result = print(ast)
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
