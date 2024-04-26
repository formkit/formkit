import jiti from 'jiti'
import type { UnpluginOptions } from 'unplugin'
import type { ResolvedOptions } from '../types'
import { FORMKIT_CONFIG_PREFIX } from '../index'
import { getConfigProperty } from '../utils/config'
import { trackReload } from '../utils/config'
import { consola } from 'consola'
import { isIdentifier } from '@babel/types'
import {
  addImport,
  createObject,
  createProperty,
  extract,
  extractMethodAsFunction,
} from '../utils/ast'
import type { NodePath } from '@babel/traverse'
import type {
  Node,
  File,
  ObjectExpression,
  ObjectProperty,
  ImportDeclaration,
  Program,
  Statement,
} from '@babel/types'
import tcjs from '@babel/template'
import type LocaleImport from '@formkit/i18n/locales/en'
import type { DefineConfigOptions } from '@formkit/vue'
const t: typeof tcjs = ('default' in tcjs ? tcjs.default : tcjs) as typeof tcjs

/**
 * The load hook for unplugin.
 * @returns
 */
export function createLoad(
  opts: ResolvedOptions
): Exclude<UnpluginOptions['load'], undefined> {
  return async function load(id) {
    if (id.startsWith('\0' + FORMKIT_CONFIG_PREFIX)) {
      trackReload.call(this, opts, id)
      const moduleAST = await createModuleAST(opts, id)
      return opts.generate(moduleAST)
    }
    return null
  }
}

/**
 * Create a module AST for the given module id.
 * @param opts - Resolved options
 * @param id - The module id
 * @returns
 */
async function createModuleAST(
  opts: ResolvedOptions,
  id: string
): Promise<File | Program> {
  const [plugin, identifier] = id
    .substring(FORMKIT_CONFIG_PREFIX.length + 1)
    .split(':')

  switch (plugin) {
    case 'inputs':
      return await createVirtualInputConfig(opts, identifier)

    case 'library':
      return await createDeoptimizedLibrary(opts)

    case 'validation':
      return await createValidationConfig()

    case 'rules':
      return await createVirtualRuleConfig(opts, identifier)

    case 'i18n':
      return await createI18nPlugin()

    case 'locales':
      return await createLocalesConfig(opts, identifier.split(','))

    case 'messages':
      return await createMessagesConfig(opts)

    case 'icons':
      return await createIconConfig(opts, identifier)

    default:
      throw new Error(`Unknown FormKit virtual module: formkit/${plugin}`)
  }
}

/**
 * Create a validation configuration for the given options.
 * @param opts - Resolved options
 */
function createValidationConfig(): File | Program {
  return t.program
    .ast`import { createValidationPlugin } from '@formkit/validation'
const validation = createValidationPlugin({})
export { validation }
`
}

function createVirtualRuleConfig(
  opts: ResolvedOptions,
  ruleName: string
): File | Program {
  if (opts.configAst) {
    const rules = getConfigProperty(opts, 'rules')?.get('value')
    if (rules && !rules.isObjectExpression()) {
      consola.warn(
        "[FormKit de-opt] cannot statically analyze DefineConfigOptions['rules']. Please use an inline object literal."
      )
    } else if (rules?.isObjectExpression()) {
      let ruleDefinition: File | undefined
      rules.traverse({
        ObjectProperty(path) {
          if (
            path.parentPath === rules &&
            isIdentifier(path.node.key, { name: ruleName })
          ) {
            ruleDefinition = extract(path.get('value'))
            path.stop()
          }
        },
        ObjectMethod(path) {
          if (
            path.parentPath === rules &&
            isIdentifier(path.node.key, { name: ruleName })
          ) {
            ruleDefinition = extractMethodAsFunction(path, '__extracted__')
            path.stop()
          }
        },
      })

      if (ruleDefinition) {
        const exported = t.statements.ast`
        export const ${ruleName} = __extracted__;`
        opts.traverse(ruleDefinition, {
          Program(path) {
            path.pushContainer('body', exported)
          },
        })
        return ruleDefinition
      }
    }
  }
  return t.program.ast`export { ${ruleName} } from '@formkit/rules'`
}

/**
 * Create a library that includes all core inputs and any additional inputs.
 * It is not ideal for this to be used, but when the source code uses dynamic
 * references to input types we have no choice but to resolve them at runtime.
 * @param opts - Resolved options
 * @returns
 */
function createDeoptimizedLibrary(opts: ResolvedOptions): File | Program {
  const definedInputs = getConfigProperty(opts, 'inputs')
  const extracted = definedInputs
    ? extract(definedInputs.get('value'), false)
    : t.ast`const __extracted__ = {}`
  return t.program.ast`
    import { createLibraryPlugin, inputs } from '@formkit/inputs'
    ${extracted}
    const library = createLibraryPlugin({
      ...inputs,
      ...__extracted__,
    })
    export { library }
  `
}

/**
 * Creates a "library" for a virtual input configuration. This creates a single
 * library that can be only imports the code necessary to boot that single
 * input.
 * @param opts - Resolved options
 * @param inputName - The name of the input to create a virtual config for.
 * @returns
 */
export async function createVirtualInputConfig(
  opts: ResolvedOptions,
  inputName: string
): Promise<File | Program> {
  if (opts.configAst) {
    const inputs = getConfigProperty(opts, 'inputs')
    if (inputs && inputs.node.value.type !== 'ObjectExpression') {
      consola.warn(
        "[FormKit de-opt] cannot statically analyze DefineConfigOptions['inputs']. Please use an inline object literal."
      )
    } else if (inputs?.node.value.type === 'ObjectExpression') {
      let inputPropertyValue: NodePath<Node> | undefined
      inputs.get('value').traverse({
        ObjectProperty(path) {
          if (
            path.parentPath.parentPath === inputs &&
            isIdentifier(path.node.key, { name: inputName })
          ) {
            inputPropertyValue = path.get('value')
            path.stop()
          }
        },
      })
      if (inputPropertyValue) {
        const inputDefinition = extract(inputPropertyValue)
        const library = t.statements.ast`const library = () => {
          return false
        }
        library.library = (node) => node.define(__extracted__);
        export { library };`
        opts.traverse(inputDefinition, {
          Program(path) {
            path.pushContainer('body', library)
          },
        })
        return inputDefinition
      }
    }
  }

  // The configuration does not define the given input, so we can attempt to
  // directly import it from the @formkit/inputs package.
  const { inputs } = await import('@formkit/inputs')
  if (!(inputName in inputs)) {
    console.error(`Unknown input: "${inputName}"`)
    throw new Error(
      `Input ${inputName} is not a registered input or an available input in @formkit/inputs.`
    )
  }
  return t.program.ast`import { ${inputName} } from '@formkit/inputs';
  const library = () => {};
  library.library = (node) => node.define(${inputName});
  export { library };`
}

/**
 * Create an empty i18n plugin.
 * @param opts - Resolved options
 * @returns
 */
export async function createI18nPlugin(): Promise<File | Program> {
  return t.program.ast`
  import { createI18nPlugin } from '@formkit/i18n/i18n'
  export const i18n = createI18nPlugin({})
  `
}

/**
 * Create an i18n locale registry for the given messages.
 * @param opts - Resolved options
 * @param messages - The rules to import locales for.
 */
export async function createLocalesConfig(
  opts: ResolvedOptions,
  messages: string[]
): Promise<File | Program> {
  const [optimizableLocales, deoptimizedLocales] = getLocales(opts)
  const registry = createObject()
  const overrides = getConfigProperty(opts, 'messages')
  if (opts.configLocalize) {
    opts.configLocalize.forEach((message) => {
      messages.push(message)
    })
  }
  const ast = t.program.ast`export const locales = ${registry}`
  if (overrides && overrides.get('value').isObjectExpression()) {
    const extendId = addImport(opts, ast, {
      from: '@formkit/utils',
      name: 'extend',
    })
    const overridesId = addImport(opts, ast, {
      from: 'virtual:formkit/messages',
      name: 'messages',
    })
    opts.traverse(ast, {
      VariableDeclarator(path) {
        if (path.get('id').isIdentifier({ name: 'locales' })) {
          path.node.init = t.expression
            .ast`${extendId}(${path.node.init}, ${overridesId})`
        }
      },
    })
  }
  await insertOptimizedLocales(
    opts,
    ast,
    registry,
    optimizableLocales,
    messages
  )
  await insertDeoptimizedLocales(opts, ast, registry, deoptimizedLocales)
  return ast
}

/**
 * Fetch the locales from the configuration and categorize them into optimized
 * and deoptimized locales.
 * @param opts - Resolved options
 * @returns
 */
function getLocales(
  opts: ResolvedOptions
): [optimized: string[], deoptimized: Map<string, NodePath<Node>>] {
  const optimizedLocales: string[] = []
  const deoptimizedLocales = new Map<string, NodePath<Node>>()
  getConfigProperty(opts, 'locales')?.traverse({
    ObjectProperty(path) {
      path.skip()
      const key = path.get('key')
      if (key.isIdentifier()) {
        const localeName = key.node.name
        const localeValue = path.get('value')
        if (
          localeValue.isIdentifier() &&
          isOptimizableLocale(localeName, localeValue)
        ) {
          optimizedLocales.push(localeName)
        } else {
          consola.warn(
            `[FormKit de-opt] could not statically extract messages for locale ${localeName}.`
          )
          deoptimizedLocales.set(localeName, localeValue)
        }
      }
    },
    SpreadElement() {
      consola.warn(
        '[FormKit de-opt] could not statically analyze DefineConfigOptions[locales].'
      )
      throw new Error(
        'Cannot process spread elements in FormKit locales configuration.'
      )
    },
  })

  if (!optimizedLocales.length && !deoptimizedLocales.size) {
    optimizedLocales.push('en')
  }
  return [optimizedLocales, deoptimizedLocales]
}

/**
 * Determines if this locale can be optimized or not — currently this is only
 * possible if the locale is imported from the `@formkit/i18n` package since we
 * know the structure of those locales allow for individual message imports.
 * @param localeName - The locale name
 * @param identifier - The identifier node
 * @returns
 */
function isOptimizableLocale(localeName: string, identifier: NodePath<Node>) {
  const path = identifier.scope.getBinding(localeName)?.path
  if (path && path.isImportSpecifier()) {
    const source = (path.parentPath as NodePath<ImportDeclaration>).get(
      'source'
    )
    if (source.isStringLiteral()) {
      return source.node.value.startsWith('@formkit/i18n')
    }
  }
  return false
}

/**
 * Modifies the ast to include the optimized locales by importing only the
 * necessary messages from the optimizedLocales.
 * @param ast - The program AST to insert into
 * @param registry - The ObjectExpression that is the registry of locales
 * @param optimizableLocales - A string array of locales that can be optimized
 * @param messages - A string array of messages to import
 */
async function insertOptimizedLocales(
  opts: ResolvedOptions,
  ast: Program,
  registry: ObjectExpression,
  optimizableLocales: string[],
  messages: string[]
) {
  const localeMap = new Map<
    string,
    [validation: ObjectExpression, ui: ObjectExpression]
  >()

  // We explicitly load the "optimizable" locales individually to check that
  // the given messages are available in the locale.
  const loadedLocales = await Promise.all(
    optimizableLocales.map(
      (locale) =>
        import(`@formkit/i18n/locales/${locale}`) as Promise<{
          default: typeof LocaleImport
        }>
    )
  )
  const loadedLocaleMap = optimizableLocales.reduce((map, locale, index) => {
    map.set(locale, loadedLocales[index].default)
    return map
  }, new Map<string, (typeof loadedLocales)[number]['default']>())

  registry.properties = optimizableLocales.map((locale) => {
    const validation = createObject()
    const ui = createObject()
    const loadedLocale = loadedLocaleMap.get(locale)
    localeMap.set(locale, [validation, ui])

    if (loadedLocale) {
      const [uiMessages, validationMessages, notFound] = messages.reduce(
        ([ui, validation, notFound], message) => {
          if (message in loadedLocale.ui) {
            ui.push(message)
          } else if (message in loadedLocale.validation) {
            validation.push(message)
          } else {
            notFound.push(message)
          }
          return [ui, validation, notFound]
        },
        [[], [], []] as [string[], string[], string[]]
      )
      const uiNames = uiMessages.map((name) => {
        return addImport(opts, ast, {
          from: `@formkit/i18n/locales/${locale}`,
          name: name,
        })
      })
      const validationNames = validationMessages.map((name) => {
        return addImport(opts, ast, {
          from: `@formkit/i18n/locales/${locale}`,
          name: name,
        })
      })

      ui.properties = uiMessages.map((name, index) => {
        return createProperty(name, t.expression.ast`${uiNames[index]}`)
      })
      validation.properties = validationMessages.map((name, index) => {
        return createProperty(name, t.expression.ast`${validationNames[index]}`)
      })

      if (notFound.length) {
        consola.warn(
          `Could not find the following messages in the ${locale} locale: ${notFound.join(
            ', '
          )}`
        )
      }
    }

    return {
      type: 'ObjectProperty',
      key: {
        type: 'Identifier',
        name: locale,
      },
      value: t.expression.ast`{ validation: ${validation}, ui: ${ui} }`,
    } as ObjectProperty
  })
}

/**
 * Inserts the deoptimized locales into the registry.
 * @param _opts - Resolved options
 * @param ast - The virtual module ast
 * @param registry - The registry of locales
 * @param deoptimizedLocales - A map of deoptimized locales and their path in the config
 */
async function insertDeoptimizedLocales(
  _opts: ResolvedOptions,
  ast: Program,
  registry: ObjectExpression,
  deoptimizedLocales: Map<string, NodePath<Node>>
) {
  const extractions: Statement[] = []
  deoptimizedLocales.forEach((node, locale) => {
    const localName = `__${locale}__`
    const extracted = extract(node, false, localName)
    extractions.push(...(Array.isArray(extracted) ? extracted : [extracted]))
    registry.properties.push(
      createProperty(locale, t.expression.ast`${localName}`)
    )
  })
  ast.body.unshift(...extractions)
}

/**
 * Create a messages configuration for the given options.
 */
async function createMessagesConfig(
  opts: ResolvedOptions
): Promise<File | Program> {
  const messages = getConfigProperty(opts, 'messages')
  if (!messages) {
    return t.program.ast`export const messages = {}`
  }

  const file = extract(messages.get('value'), true, 'messages')
  file.program.body.push(t.statement.ast`export { messages }`)
  return file
}

async function createIconConfig(
  opts: ResolvedOptions,
  icon: string
): Promise<File | Program> {
  // If there are icon loader considerations we should be prepared for them:
  if (opts.configPath) {
    try {
      const config = (await jiti(opts.configPath)) as DefineConfigOptions
      opts.configIconLoaderUrl = config.iconLoaderUrl
      opts.configIconLoader = config.iconLoader
    } catch (err) {
      consola.warn(
        '[FormKit deopt] Failed to load config file to optimize icons.'
      )
    }
  }

  // TODO: implement icon loader logic
  return t.program.ast`export const ${icon} = null`
}
