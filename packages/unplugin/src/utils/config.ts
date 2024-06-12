import type { UnpluginContext, UnpluginBuildContext } from 'unplugin'
import cjsTraverse from '@babel/traverse'
import type { NodePath } from '@babel/traverse'
import * as parser from '@babel/parser'
import { empty, extend } from '@formkit/vue/utils'
import {
  configureFormKitInstance,
  createFeats,
  extractUsedFeatures,
} from './formkit'
import { configureFormKitSchemaInstance } from './formkitSchema'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'pathe'
import { parse as recastParser, print } from 'recast'
import type {
  File,
  Node,
  ObjectProperty,
  Program,
  ImportDeclaration,
  ImportSpecifier,
  ImportDefaultSpecifier,
} from '@babel/types'
import { createBaseConfig, createVirtualInputConfig } from '../hooks/load'
import type {
  Options,
  ResolvedOptions,
  Traverse,
  ASTTools,
  UsedFeatures,
} from '../types'
import { consola } from 'consola'
import esbuild from 'esbuild'
import { extract, getKeyName, loadFromAST } from './ast'
import { URL } from 'url'
import {
  createNode,
  type FormKitConfig,
  type FormKitTypeDefinition,
} from '@formkit/vue/core'
import tcjs from '@babel/template'
import { configureFormKitIconInstance } from './formkitIcon'
const t: typeof tcjs = ('default' in tcjs ? tcjs.default : tcjs) as typeof tcjs

// The babel/traverse package imports an an object for some reason
// so we need to get the default property and preserve the types.
const traverse: Traverse =
  typeof cjsTraverse === 'function' ? cjsTraverse : (cjsTraverse as any).default

const ABSOLUTE_PATH_RE = /^(?:\/|[a-zA-Z]:\\)/

const classesCache = new WeakMap<ResolvedOptions['configMemo'], Set<string>>()

const globalClassesCache = new WeakMap<
  ResolvedOptions['configMemo'],
  Record<string, Record<string, boolean>>
>()

const inputClassesCache = new WeakMap<
  ResolvedOptions['configMemo'],
  Map<string, Record<string, Record<string, boolean>>>
>()

const familyClassesCache = new WeakMap<
  ResolvedOptions['configMemo'],
  Map<string, Record<string, Record<string, boolean>>>
>()

const rootClassesCache = new WeakMap<
  ResolvedOptions['configMemo'],
  undefined | Exclude<FormKitConfig['rootClasses'], false>
>()

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
          {
            name: 'FormKitSchema',
            from: '@formkit/vue',
            codeMod: configureFormKitSchemaInstance,
          },
          {
            name: 'FormKitIcon',
            from: '@formkit/vue',
            codeMod: configureFormKitIconInstance,
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
    configMemo: {},
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
              const propertyName = getKeyName(propertyPath.get('key'))
              if (
                propertyPath.parentPath.parentPath === path &&
                propertyName === name
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
      opts.configMemo = {}
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
  const keys = [
    'debug',
    'inputs',
    'validation',
    'i18n',
    'icons',
    'theme',
    'schema',
  ] as const
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
        (acc, key) => ({
          ...acc,
          [key]: key === 'debug' ? false : value.node.value,
        }),
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
        (acc, key) => ({
          ...acc,
          [key]: optimzedOptions[key] ?? (key === 'debug' ? false : true),
        }),
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

export function getPathWithoutQuery(filePath: string) {
  if (!filePath.startsWith('/')) return filePath
  // Assuming filePath is an absolute URL, 'file://' prefix is used for compatibility
  const prefix = 'file://'
  const url = new URL(prefix + filePath)

  // Remove the 'file:///' prefix to get the original file path format
  return url.pathname.substring(prefix.length)
}

/**
 * Get all the input names
 * @param opts - Resolved options
 * @returns
 */
export async function getAllInputs(
  opts: ResolvedOptions
): Promise<Set<string>> {
  const allInputs = new Set<string>()
  if (opts.builtins.inputs) {
    const { inputs } = await import('@formkit/vue/inputs')
    Object.keys(inputs).forEach((input) => allInputs.add(input))
    const hasPro = await isInstalled(opts, '@formkit/pro')
    if (hasPro) {
      try {
        await getProKey(opts)
        const loaded = await loadFromAST(
          opts,
          t.program.ast`import { inputs } from '@formkit/pro'
      const inputNames = Object.keys(inputs)
      export { inputNames }`
        )
        if (loaded && typeof loaded === 'object' && 'inputNames' in loaded) {
          const inputNames = loaded.inputNames as string[]
          inputNames.forEach((input) => allInputs.add(input))
        }
      } catch (e) {
        // Do nothing — we just dont need to import the pro input details — the most likely
        // error here is that the user has not set a pro key.
      }
    }
  }
  if (opts.configAst) {
    getConfigProperty(opts, 'inputs')?.traverse({
      ObjectProperty(path) {
        const inputName = getKeyName(path.get('key'))
        if (inputName) {
          allInputs.add(inputName)
        }
        path.skip()
      },
    })
  }
  return allInputs
}

/**
 * Gets the rootClasses function from the current configuration or undefined.
 * @param opts - Reoslved options
 * @returns
 */
export async function getRootClasses(
  opts: ResolvedOptions
): Promise<Exclude<FormKitConfig['rootClasses'], false> | undefined> {
  if (rootClassesCache.has(opts.configMemo)) {
    return rootClassesCache.get(opts.configMemo)
  }
  const astPath = getConfigProperty(opts, 'rootClasses')
  let rootClasses = undefined
  if (astPath) {
    const file = extract(astPath?.get('value'), true, '__rootClasses')
    file.program.body.push(t.statement.ast`export { __rootClasses }`)
    const extracted = await loadFromAST(opts, file)
    if (typeof extracted.__rootClasses === 'function') {
      rootClasses = extracted.__rootClasses as Exclude<
        FormKitConfig['rootClasses'],
        false
      >
    }
  }
  rootClassesCache.set(opts.configMemo, rootClasses)
  return rootClasses
}

/**
 * Gets all the possible classes for all the possible inputs in this project. This requires that we know every
 * possible input type that could be used in the project. This is a limitation of the current implementation.
 * @param opts - Resolved options
 * @returns
 */
export async function getAllClasses(opts: ResolvedOptions) {
  if (classesCache.get(opts.configMemo)) {
    return classesCache.get(opts.configMemo)!
  }
  const inputs = await getAllInputs(opts)
  const feats = createFeats()
  await Promise.all(
    [...inputs].map((input) => extractUsedFeatures(opts, input, feats))
  )
  const classes = feats.classes
  classesCache.set(opts.configMemo, classes)
  return classes
}

/**
 * Get all the global classes for the given configuration (assuming we know all the possible inputs)
 * there is a known issue here that we cannot resolve what inputs may be used in a plugin library. This
 * is a relatively rare feature but should be considered.
 * @param opts - Resolved options
 * @returns
 */
export async function getGlobalClasses(
  opts: ResolvedOptions
): Promise<Record<string, Record<string, boolean>>> {
  if (globalClassesCache.has(opts.configMemo)) {
    return globalClassesCache.get(opts.configMemo)!
  }
  const rootClasses = await getRootClasses(opts)
  const classesBySection: Record<string, Record<string, boolean>> = {}

  if (rootClasses) {
    const node = createNode()
    const classes = await getAllClasses(opts)
    classes.forEach((sectionName) => {
      const classes = rootClasses(sectionName, node)
      delete classes[`formkit-${sectionName}`]
      if (!empty(classes)) {
        Object.assign(classesBySection, {
          [sectionName]: classes,
        })
      }
    })
  }
  globalClassesCache.set(opts.configMemo, classesBySection)
  return classesBySection
}

/**
 * Get all the classes for a given family.
 * @param opts - Resolved options
 * @param family - The family to get the classes for
 */
export async function getFamilyClasses(opts: ResolvedOptions, family: string) {
  if (!familyClassesCache.has(opts.configMemo)) {
    familyClassesCache.set(opts.configMemo, new Map())
  }
  const cache = familyClassesCache.get(opts.configMemo)!
  if (cache.has(family)) {
    return cache.get(family)!
  }
  const rootClasses = await getRootClasses(opts)
  const classesBySection: Record<string, Record<string, boolean>> = {}
  if (rootClasses) {
    const globalClasses = await getGlobalClasses(opts)
    const classes = await getAllClasses(opts)
    const node = createNode({ props: { family } })
    classes.forEach((sectionName) => {
      const result = rootClasses(sectionName, node)
      const classes: Record<string, boolean> = {}
      for (const className in result) {
        if (
          !(className in (globalClasses[sectionName] ?? {})) &&
          className !== `formkit-${sectionName}`
        ) {
          classes[className] = true
        }
      }
      if (!empty(classes)) {
        Object.assign(classesBySection, {
          [sectionName]: classes,
        })
      }
    })
  }
  cache.set(family, classesBySection)
  return classesBySection
}

/**
 * This function is used to get all the classes for a given input. However, importantly this function does not
 * recursively resolve section names since it is used to chunk each input into its own module — as such it does not
 * recurse when calling extractUsedFeatures to prevent loading sub-input classes in this input’s class module.
 * @param opts - Resolved options.
 * @param input - The string name of the input we are loading.
 * @returns
 */
export async function getInputClasses(
  opts: ResolvedOptions,
  input: string,
  recursiveInputFeats: UsedFeatures
) {
  if (!inputClassesCache.has(opts.configMemo)) {
    inputClassesCache.set(opts.configMemo, new Map())
  }
  const cache = inputClassesCache.get(opts.configMemo)!
  if (cache.has(input)) {
    return cache.get(input)!
  }
  const rootClasses = await getRootClasses(opts)
  const definition = await getInputDefinition(opts, input)
  const classesBySection: Record<string, Record<string, boolean>> = {}

  if (rootClasses) {
    const feats = createFeats()
    const excludeInputs = new Set([...recursiveInputFeats.inputs])
    excludeInputs.delete(input)
    // We want the feats to already include any sub-inputs as this will prevent recursion.
    feats.inputs = excludeInputs
    await extractUsedFeatures(opts, input, feats)
    const node = createNode({ props: { type: input } })

    const globalClasses = await getGlobalClasses(opts)

    let familyClasses: Record<string, Record<string, boolean>> = {}
    if (definition && definition.family) {
      familyClasses = await getFamilyClasses(opts, definition.family)
    }

    feats.classes.forEach((sectionName) => {
      const result = rootClasses(sectionName, node)
      const classes: Record<string, boolean> = {}
      for (const className in result) {
        if (
          !(className in (globalClasses[sectionName] ?? {})) &&
          !(className in (familyClasses[sectionName] ?? {})) &&
          className !== `formkit-${sectionName}`
        ) {
          classes[className] = true
        }
      }
      if (!empty(classes)) {
        classesBySection[sectionName] = classes
      }
    })
  }

  return classesBySection
}

/**
 * Determines whether or not the package is installed on the user’s project.
 * @param packageName - The name of the package.
 */
export async function isInstalled(
  opts: ResolvedOptions,
  packageName: string
): Promise<boolean> {
  const loader = await loadFromAST(
    opts,
    t.program.ast`
  export async function canImport() {
    try {
      await import('${packageName}')
      return true
    } catch (err) {
      return false
    }
  }
`
  )
  if (
    loader &&
    'canImport' in loader &&
    typeof loader.canImport === 'function'
  ) {
    return (await loader.canImport()) as boolean
  }
  return false
}

/**
 * Determines whether or not the package is installed on the user’s project.
 * @param packageName - The name of the package.
 */
export async function isProInput(
  opts: ResolvedOptions,
  inputName: string
): Promise<boolean> {
  const loader = await loadFromAST(
    opts,
    t.program.ast`
  export async function canImport() {
    try {
      const { inputs } = await import('@formkit/pro')
      if (typeof inputs === "object" && "${inputName}" in inputs) {
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }
`
  )
  if (
    loader &&
    'canImport' in loader &&
    typeof loader.canImport === 'function'
  ) {
    return (await loader.canImport()) as boolean
  }
  return false
}

/**
 * Attempts to load an input definition for a given input "type" as defined in the formkit config.
 * @param opts - Resolved options
 * @param input - The "name" of the input to load as defined in the configuration.
 * @param ast - Optionally, attempt to load the input definition from an AST.
 * @returns
 */
const inputDefinitionMemo = new WeakMap<
  ResolvedOptions['configMemo'],
  Map<string, FormKitTypeDefinition | undefined>
>()
export async function getInputDefinition(
  opts: ResolvedOptions,
  input: string,
  ast?: File | Program
): Promise<
  | FormKitTypeDefinition
  | (FormKitTypeDefinition & { __isFromLibrary: true })
  | undefined
> {
  if (!inputDefinitionMemo.has(opts.configMemo)) {
    inputDefinitionMemo.set(opts.configMemo, new Map())
  }
  if (inputDefinitionMemo.get(opts.configMemo)!.has(input)) {
    return inputDefinitionMemo.get(opts.configMemo)!.get(input)
  }
  try {
    // This silly iife is purely for TS to be happy due to incomplete control flow analysis: https://github.com/microsoft/TypeScript/issues/9998
    const importPath = await (async (): Promise<
      NodePath<ImportSpecifier | ImportDefaultSpecifier> | undefined
    > => {
      ast = ast ?? (await createVirtualInputConfig(opts, input, false))
      let importPath:
        | NodePath<ImportSpecifier | ImportDefaultSpecifier>
        | undefined = undefined
      opts.traverse(ast, {
        ImportSpecifier(path) {
          if (path.get('local').isIdentifier({ name: input })) {
            importPath = path
            path.stop()
          }
        },
        ImportDefaultSpecifier(path) {
          if (path.get('local').isIdentifier({ name: input })) {
            importPath = path
            path.stop()
          }
        },
      })
      return importPath
    })()
    if (importPath) {
      const importNode = importPath.parentPath.node as ImportDeclaration
      const importName = importPath.isImportDefaultSpecifier()
        ? 'default'
        : input
      if (importNode.source.type === 'StringLiteral') {
        const importFrom = importNode.source.value
        if (importFrom.startsWith('virtual:formkit/pro-input:')) {
          const result = await getProInputDefinition(opts, input)
          inputDefinitionMemo.get(opts.configMemo)!.set(input, result)
          return result
        } else {
          const module = await import(importFrom)
          if (importName in module) {
            const result = module[importName] as FormKitTypeDefinition
            inputDefinitionMemo.get(opts.configMemo)!.set(input, result)
            return result
          }
        }
      }
    } else if (ast) {
      // If we have an AST, we can try to write this to a file and resolve it.
      const { library: libraryPlugin } = await loadFromAST(opts, ast)
      if (libraryPlugin && typeof libraryPlugin.library === 'function') {
        let definition: FormKitTypeDefinition | undefined = undefined
        // we use a mock node to extract the definition for the defined input.
        const mockNode = {
          props: { type: input },
          define: (def: FormKitTypeDefinition) => {
            definition = def
          },
        }
        libraryPlugin.library(mockNode)
        inputDefinitionMemo.get(opts.configMemo)!.set(input, definition)
        return definition
      }
    }
  } catch (e) {
    // Do nothing
  }
  const result = await getLibraryInputDefinition(opts, input)
  if (!result) {
    consola.warn(
      `[FormKit de-opt] Could not load input definition for: ${input}`
    )
  }
  inputDefinitionMemo.get(opts.configMemo)!.set(input, result)
  return result
}

/**
 * Get the input definition for a FormKit Pro input.
 * @param opts - Resolved options
 * @param input - The input to get the definition for.
 */
async function getProInputDefinition(
  opts: ResolvedOptions,
  input: string
): Promise<FormKitTypeDefinition | undefined> {
  let definition: FormKitTypeDefinition | undefined = undefined
  const proKey = await getProKey(opts)
  const loader = await loadFromAST(
    opts,
    t.program.ast`
  import { createProPlugin } from '@formkit/pro'
  import { ${input} } from '@formkit/pro'
  export const plugin = createProPlugin('${proKey}', { ${input} })
  `
  )
  if (loader && loader.plugin && typeof loader.plugin.library === 'function') {
    const mockNode = {
      props: { type: input },
      define: (def: FormKitTypeDefinition) => {
        definition = def
      },
    }
    loader.plugin.library(mockNode)
  }
  return definition
}

/**
 * Get the resolved options.
 * @param opts - Resolved options
 */
export async function getProKey(opts: ResolvedOptions) {
  const value = getConfigProperty(opts, 'pro')?.get('value')
  if (value?.isStringLiteral()) {
    return value.node.value
  }
  if (value) {
    throw new Error(
      '[FormKit]: Cannot read pro key from your FormKit configuration, please use a string literal (pro: "fk-000000").'
    )
  }
  throw new Error(
    '[FormKit]: Cannot read pro key from your FormKit configuration, please add a pro key (pro: "fk-000000").'
  )
}

/**
 * Load the input definition for a library input.
 * @param opts - Resolved options
 * @param input - The input to get the definition for.
 */
export async function getLibraryInputDefinition(
  opts: ResolvedOptions,
  input: string
): Promise<FormKitTypeDefinition | undefined> {
  // We dont have AST or an import path — it could be the input we are looking for is loaded
  // via the library of a plugin.
  const ast = await createBaseConfig(opts)
  ast.body.push(
    ...t.statements.ast`
  let definition = undefined
  const fauxNode = {
    props: { type: '${input}' },
    define(def) {
      definition = def
    }
  }
  const options = nodeOptions()
  if (options.plugins) {
    options.plugins.forEach(plugin => {
      if (plugin.library) {
        plugin.library(fauxNode)
      }
    })
  }
  export { definition }`
  )
  const loader = await loadFromAST(opts, ast)
  if (loader && typeof loader.definition === 'object') {
    loader.definition.__isFromLibrary = true
    return loader.definition as FormKitTypeDefinition
  }
  return undefined
}
