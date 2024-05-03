import type { UnpluginContext, UnpluginBuildContext } from 'unplugin'
import cjsTraverse from '@babel/traverse'
import type { NodePath } from '@babel/traverse'
import * as parser from '@babel/parser'
import { extend } from '@formkit/utils'
import { configureFormKitInstance } from './formkit'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'pathe'
import { parse as recastParser, print } from 'recast'
import type { File, Node, ObjectProperty, Program } from '@babel/types'
import type { Options, ResolvedOptions, Traverse, ASTTools } from '../types'
import { consola } from 'consola'
import esbuild from 'esbuild'
import { getKeyName } from './ast'

// The babel/traverse package imports an an object for some reason
// so we need to get the default property and preserve the types.
const traverse: Traverse =
  typeof cjsTraverse === 'function' ? cjsTraverse : (cjsTraverse as any).default

const ABSOLUTE_PATH_RE = /^(?:\/|[a-zA-Z]:\\)/

function createASTTools(): ASTTools {
  const parse = (code: string) => recastParser(code, { parser })
  const generate = (ast: Node) => print(ast, { parser })
  return { parse, generate, traverse }
}

/**
 * Resolves the configuration options for the plugin.
 * @param options - Options for the formkit build plugin.
 * @returns
 */
export function createOpts(options: Partial<Options>): ResolvedOptions {
  const { parse, generate, traverse } = createASTTools()
  const opts: Options & Exclude<Partial<ResolvedOptions>, keyof Options> =
    extend(
      {
        components: [
          {
            name: 'FormKit',
            from: '@formkit/vue',
            codeMod: configureFormKitInstance,
          },
        ],
      },
      options ?? {},
      true
    ) as Options

  const configPath = resolveConfig(opts)
  opts.configPath = configPath
  opts.parse = parse
  const configAst = createConfigAst(opts)
  const [optimize, builtins] = determineOptimization(traverse, configAst)
  const resolvedConfig = {
    ...opts,
    configAst,
    configPath,
    configParseCount: 1,
    traverse,
    parse,
    generate,
    optimize,
    builtins,
  } as ResolvedOptions
  addConfigLocalize(resolvedConfig as ResolvedOptions)
  return resolvedConfig
}

/**
 * Generates configuration AST
 * @param parse - Generates the configuration ast from the given path.
 * @param configPath - The path to the configuration file.
 * @returns
 */
export function createConfigAst(
  opts: Options & Exclude<Partial<ResolvedOptions>, keyof Options>
): File | Program | undefined {
  if (opts.parse && opts.configPath && existsSync(opts.configPath)) {
    const configSource = readFileSync(opts.configPath, { encoding: 'utf8' })
    const tsFreeSource = esbuild.transformSync(configSource, {
      loader: 'ts',
    }).code
    opts.configCode = tsFreeSource
    return opts.parse(tsFreeSource)
  }
  return undefined
}

/**
 * Resolve the absolute path to the configuration file.
 * @param configFile - The configuration file to attempt to resolve.
 */
function resolveConfig(opts: Options): string | undefined {
  const configFile = opts.configFile ?? 'formkit.config'
  const path = resolveFile(configFile)
  if (opts.configFile && !path) {
    throw new Error(`Could not find config file: ${opts.configFile}`)
  }
  return path
}

/**
 * Attempts to resolve a file path
 * @param file - The file to resolve
 * @returns
 */
export function resolveFile(file: string) {
  const exts = ['ts', 'mjs', 'js']
  const dir = file.startsWith('.') ? process.cwd() : ''
  let paths: string[] = []

  if (exts.some((ext) => file.endsWith('.' + ext))) {
    // If the config file has an extension, we don't need to try them all.
    paths = [ABSOLUTE_PATH_RE.test(file) ? resolve(file) : resolve(dir, file)]
  } else {
    // If the config file doesn’t have an extension, try them all.
    paths = exts.map((ext) => resolve(dir, `${file}.${ext}`))
  }
  return paths.find((path) => existsSync(path))
}

/**
 * Given the resolved configuration source ast, return the ast node that
 * represents the property with the given name.
 * @param opts - Resolved options
 * @param name - The name of the property to get from the config source.
 * @returns
 */
export function getConfigProperty(
  opts: { traverse: ASTTools['traverse']; configAst?: File | Program },
  name: string
): NodePath<ObjectProperty> | undefined {
  let prop: NodePath<ObjectProperty> | undefined
  if (!opts.configAst) return undefined
  opts.traverse(opts.configAst, {
    CallExpression(path) {
      if (
        path.node.callee.type === 'Identifier' &&
        path.node.callee.name === 'defineFormKitConfig'
      ) {
        const [config] = path.node.arguments
        if (config.type === 'ObjectExpression') {
          path.traverse({
            ObjectProperty(propertyPath) {
              path.skip()
              if (
                propertyPath.parentPath.parentPath === path &&
                propertyPath.node.key.type === 'Identifier' &&
                propertyPath.node.key.name === name
              ) {
                prop = propertyPath
                path.stop()
              }
            },
          })
          path.stop()
        } else {
          consola.warn(
            '[FormKit deopt] call defineFormKitConfig with an object literal to enable optimizations.'
          )
        }
      }
    },
  })

  return prop
}

/**
 * Extract any `localize` properties from the configuration.
 * @param opts - Resolved options
 */
function addConfigLocalize(opts: ResolvedOptions): void {
  if (opts.configAst) {
    const configLocalize: string[] = []
    const value = getConfigProperty(opts, 'localize')?.get('value')
    if (value && value.isArrayExpression()) {
      value.node.elements.forEach((el) => {
        if (el && el.type === 'StringLiteral') {
          configLocalize.push(el.value)
        }
      })
      opts.configLocalize = configLocalize
    }
  }
}

const previouslyLoaded: Record<string, number> = {}
let totalReloads = 0

/**
 * Tracks that this is a reload of the configuration.
 * @param this - The unplugin context
 * @param opts - The resolved options
 * @param id - The id of the module being reloaded
 */
export function trackReload(
  this: UnpluginContext & UnpluginBuildContext,
  opts: ResolvedOptions,
  id: string
) {
  // Track the number of times each module has been reloaded. We’ll need to
  // re-parse the config’s AST in case it has changed.
  previouslyLoaded[id] = (previouslyLoaded[id] || 0) + 1
  if (previouslyLoaded[id] > totalReloads) totalReloads = previouslyLoaded[id]

  // Make the configuration a watched file.
  if (opts.configPath) {
    this.addWatchFile(opts.configPath)
    if (opts.configParseCount < totalReloads) {
      consola.info('Reloading formkit.config.ts file')
      opts.configAst = createConfigAst(opts)
      opts.configParseCount = totalReloads
      addConfigLocalize(opts)
      const [optimize, builtins] = determineOptimization(
        opts.traverse,
        opts.configAst
      )
      opts.optimize = optimize
      opts.builtins = builtins
      opts.configIconLoaderUrl = undefined
      opts.configIconLoader = undefined
    }
  }
}

/**
 * Determines which optimizations are enabled in the configuration.
 * @param traverse - The AST traversal function
 * @param ast - The AST to traverse
 * @returns
 */
function determineOptimization(
  traverse: ASTTools['traverse'],
  ast: File | Program | undefined
): [
  optimize: ResolvedOptions['optimize'],
  builtins: ResolvedOptions['builtins']
] {
  const keys = ['inputs', 'validation', 'i18n', 'icons', 'theme'] as const
  const optimizeProperty = getConfigProperty(
    { traverse, configAst: ast },
    'optimize'
  )
  const fullTrue = keys.reduce(
    (acc, key) => ({ ...acc, [key]: true }),
    {} as { [key in (typeof keys)[number]]: boolean }
  )
  if (!optimizeProperty) {
    return [fullTrue, fullTrue]
  }
  const value = optimizeProperty.get('value')
  if (value.isBooleanLiteral()) {
    return [
      keys.reduce(
        (acc, key) => ({ ...acc, [key]: value.node.value ?? true }),
        {} as { [key in (typeof keys)[number]]: boolean }
      ),
      fullTrue,
    ]
  }

  const optimzedOptions: Partial<Record<(typeof keys)[number], boolean>> = {}
  const builtinOptions: Partial<Record<(typeof keys)[number], boolean>> = {}
  if (value.isObjectExpression()) {
    value.traverse({
      ObjectProperty(path) {
        path.skip()
        const value = path.get('value')
        const optimizationName = getKeyName(path.get('key'))
        if (value.isBooleanLiteral()) {
          if (
            optimizationName &&
            keys.includes(optimizationName as (typeof keys)[number])
          ) {
            optimzedOptions[optimizationName as (typeof keys)[number]] =
              value.node.value
          }
        } else if (value.isObjectExpression()) {
          value.traverse({
            ObjectProperty(prop) {
              prop.skip()
              const value = prop.get('value')
              const optimizationKey = getKeyName(prop.get('key'))
              if (value.isBooleanLiteral() && optimizationKey === 'optimize') {
                optimzedOptions[optimizationName as (typeof keys)[number]] =
                  value.node.value
              } else if (
                value.isBooleanLiteral() &&
                optimizationKey === 'builtins'
              ) {
                builtinOptions[optimizationName as (typeof keys)[number]] =
                  value.node.value
              } else {
                throw new Error(
                  `Invalid optimize property in formkit.config.ts (for ${optimizationKey}), properties must be "builtins" or "optimize" and set to a boolean.`
                )
              }
            },
          })
        }
        path.skip()
      },
    })
    return [
      keys.reduce(
        (acc, key) => ({ ...acc, [key]: optimzedOptions[key] ?? true }),
        {} as { [key in (typeof keys)[number]]: boolean }
      ),
      keys.reduce(
        (acc, key) => ({ ...acc, [key]: builtinOptions[key] ?? true }),
        {} as { [key in (typeof keys)[number]]: boolean }
      ),
    ]
  }
  throw new Error('Invalid optimize property in formkit.config.ts')
}

/**
 * Determines if all the optimizations are false.
 * @param optimize - The optimization options to check
 * @returns
 */
export function isFullDeopt(opts: ResolvedOptions): opts is Exclude<
  ResolvedOptions,
  'optimize'
> & {
  optimize: { [key in keyof ResolvedOptions['optimize']]: false }
} {
  return Object.values(opts.optimize).every((v) => !v)
}
