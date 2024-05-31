import jiti from 'jiti'
import type { UnpluginOptions } from 'unplugin'
import type { ResolvedOptions } from '../types'
import { FORMKIT_CONFIG_PREFIX } from '../index'
import {
  getConfigProperty,
  getFamilyClasses,
  getGlobalClasses,
  getInputClasses,
  getInputDefinition,
  getProKey,
  isInstalled,
  isProInput,
} from '../utils/config'
import { trackReload } from '../utils/config'
import {
  createFeats,
  extractInputTypesFromSchema,
  extractUsedFeatures,
} from '../utils/formkit'
import { consola } from 'consola'
import { isIdentifier } from '@babel/types'
import {
  addImport,
  createObject,
  createProperty,
  extract,
  extractMethodAsFunction,
  getKeyName,
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
  StringLiteral,
  CallExpression,
  Identifier,
} from '@babel/types'
import type { DefineConfigOptions } from '@formkit/vue'
import tcjs from '@babel/template'
import type LocaleImport from '@formkit/i18n/locales/en'
import { camel } from '@formkit/utils'
const t: typeof tcjs = ('default' in tcjs ? tcjs.default : tcjs) as typeof tcjs

/**
 * FormKit Pro inputs (hard coded list to prevent the @formkit/pro package being a dependency).
 */
const proInputs = [
  'dropdown',
  'toggle',
  'repeater',
  'rating',
  'autocomplete',
  'datepicker',
  'taglist',
  'mask',
  'transferlist',
  'slider',
  'colorpicker',
  'togglebuttons',
  'currency',
  'unit',
]

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

    case 'nodeOptions':
      return await createBaseConfig(opts)

    case 'library':
      return await createDeoptimizedLibrary(opts)

    case 'validation':
      return await createValidationConfig()

    case 'rules':
      if (identifier) return await createVirtualRuleConfig(opts, identifier)
      return await createDeoptimizedRuleConfig(opts)

    case 'i18n':
      return await createI18nPlugin()

    case 'locales':
      return await createLocalesConfig(
        opts,
        identifier ? identifier.split(',') : []
      )

    case 'messages':
      return await createMessagesConfig(opts)

    case 'icons':
      return await createIconConfig(opts, identifier)

    case 'themes':
      return await createThemePluginConfig(opts)

    case 'classes':
      return await createInputClassesConfig(opts, identifier)

    case 'global-classes':
      return await createGlobalClassesConfig(opts)

    case 'family-classes':
      return await createFamilyClassesConfig(opts, identifier)

    case 'input-classes':
      return await createInputOnlyClassesConfig(opts, identifier)

    case 'optimized-root-classes':
      return await createRootClassesConfig()

    case 'defaultConfig':
      return await createDefaultConfig(opts)

    case 'pro':
      return await createProPluginConfig(opts)

    case 'pro-input':
      return await createProInputConfig(identifier)

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

async function createDeoptimizedRuleConfig(
  opts: ResolvedOptions
): Promise<File | Program> {
  const program = opts.builtins.validation
    ? t.program.ast`import { rules as builtinRules } from '@formkit/rules'`
    : t.program.ast`const builtinRules = {}`
  if (opts.configAst) {
    const rules = getConfigProperty(opts, 'rules')
    if (rules && rules.get('value').isObjectExpression()) {
      const extracted = extract(rules.get('value'))
      opts.traverse(extracted, {
        Program(path) {
          path.unshiftContainer('body', program.body)
          path.pushContainer(
            'body',
            t.statement
              .ast`export const rules = { ...builtinRules, ...__extracted__ }`
          )
        },
      })
      return extracted
    }
  }
  program.body.push(t.statement.ast`export const rules = builtinRules`)
  return program
}

function createVirtualRuleConfig(
  opts: ResolvedOptions,
  ruleName: string
): File | Program {
  if (opts.configAst) {
    const rules = getConfigProperty(opts, 'rules')?.get('value')
    if (rules && !rules.isObjectExpression()) {
      consola.warn(
        "[FormKit deopt] cannot statically analyze DefineConfigOptions['rules']. Please use an inline object literal."
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
 * @param includeChildren - Whether to include the children of the input.
 * @returns
 */
export async function createVirtualInputConfig(
  opts: ResolvedOptions,
  inputName: string,
  includeChildren = true
): Promise<File> {
  const inputs = new Set<string>([inputName])

  if (includeChildren) {
    try {
      const [statements] = await createInputIdentifier(opts, inputName)
      const file: File = { type: 'File', program: t.program.ast`${statements}` }
      const input = await getInputDefinition(opts, inputName, file)
      if (input && input.schema) {
        const schema =
          typeof input.schema === 'function' ? input.schema({}) : input.schema
        await extractInputTypesFromSchema(schema, inputs)
      }
    } catch (e) {}
  }

  const defStatements: Statement[] = []
  const defineStatements: Statement[] = []
  let hasInsertedPro = false
  for await (const input of inputs) {
    const [statements, identifier] = await createInputIdentifier(opts, input)
    defStatements.push(...statements)
    if (identifier) {
      defineStatements.push(
        t.statement.ast`if (node.props.type === '${input}') {
        return node.define(${identifier});
      }`
      )
    } else if (!hasInsertedPro) {
      hasInsertedPro = true
      // We are loading a FormKit Pro input. We’ll use the plugin’s library to load it.
      defStatements.push(
        t.statement.ast`import { proPlugin } from 'virtual:formkit/pro'`
      )
      defineStatements.push(
        t.statement.ast`if (node.props.type === '${input}') {
          return proPlugin.library(node)
        }`
      )
    }
  }

  return {
    type: 'File',
    program: t.program.ast`${defStatements}
  const library = () => ${{ type: 'BooleanLiteral', value: inputs.size > 1 }};
  library.library = (node) => {
    ${defineStatements}
  }
  export { library }`,
  }
}

/**
 * Creates the code necessary to use an input. This may be an extraction or an
 * an import statement.
 * @param opts - Resolved option list
 * @param name - The name of the input
 */
async function createInputIdentifier(
  opts: ResolvedOptions,
  inputName: string
): Promise<[Statement[], Identifier | null]> {
  if (opts.configAst) {
    const inputs = getConfigProperty(opts, 'inputs')
    if (inputs && inputs.node.value.type !== 'ObjectExpression') {
      consola.warn(
        "[FormKit deopt] cannot statically analyze DefineConfigOptions['inputs']. Please use an inline object literal."
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
        const inputDefinition = extract(
          inputPropertyValue,
          false,
          `__${inputName}__`
        )
        return [
          Array.isArray(inputDefinition) ? inputDefinition : [inputDefinition],
          { type: 'Identifier', name: `__${inputName}__` } as Identifier,
        ]
      }
    }
  }

  if (!opts.builtins.inputs) {
    throw new Error(
      `Unable to locate the "${inputName}" input in the configuration (FormKit built-in inputs are disabled).`
    )
  }

  // The configuration does not define the given input, so we can attempt to
  // directly import it from the @formkit/inputs package.
  const { inputs } = await import('@formkit/inputs')

  if (inputName in inputs) {
    return [
      t.statements.ast`import { ${inputName} } from '@formkit/inputs'`,
      {
        type: 'Identifier',
        name: inputName,
      } as Identifier,
    ]
  }
  const hasPro = await isInstalled(opts, '@formkit/pro')

  if (!hasPro && proInputs.includes(inputName)) {
    throw new Error(
      `The "${inputName}" input requires @formkit/pro. Run: npx ni @formkit/pro`
    )
  } else if (hasPro) {
    // Lets try to load the input from @formkit/pro
    const isPro = await isProInput(opts, inputName)
    if (isPro) {
      const importName = `virtual:formkit/pro-input:${inputName}`
      // Note! Here we import the input name, even though we dont actually use it.
      // this is to help the getInputDefinition function to resolve the input properly.
      return [
        t.statements.ast`import { ${inputName} } from '${importName}'`,
        null,
      ]
    }
  }

  throw new Error(
    `Input "${inputName}" is not a registered input or available as a built-in input.`
  )
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
          opts.optimize.i18n &&
          localeValue.isIdentifier() &&
          isOptimizableLocale(localeName, localeValue)
        ) {
          optimizedLocales.push(localeName)
        } else {
          if (opts.optimize.i18n) {
            consola.warn(
              `[FormKit deopt] could not statically extract messages for locale ${localeName}.`
            )
          }
          deoptimizedLocales.set(localeName, localeValue)
        }
      }
    },
    SpreadElement() {
      consola.warn(
        '[FormKit deopt] could not statically analyze DefineConfigOptions[locales].'
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
  if (path && (path.isImportSpecifier() || path.isImportDefaultSpecifier())) {
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

/**
 * Load the legacy icon configuration from the config, this boots up the
 * @formkit/themes plugin.
 * @param opts - Resolved options
 */
async function createThemePluginConfig(opts: ResolvedOptions) {
  const program = t.program
    .ast`import { createThemePlugin } from '@formkit/themes'`
  const createPlugin = t.expression.ast`createThemePlugin()` as CallExpression
  const args = createPlugin.arguments

  // The signature for createThemePlugin is:
  // createThemePlugin(theme?: string, icons?: Record<string, string>, iconLoaderUrl?: IconLoaderUrl, iconLoader?: IconLoader)
  // so we try to extract these values from the theme one by one.

  const theme = getConfigProperty(opts, 'theme')?.get('value')
  if (theme && theme.isStringLiteral()) {
    args.push(theme.node)
  } else {
    args.push({ type: 'Identifier', name: 'undefined' })
  }

  const icons = getConfigProperty(opts, 'icons')?.get('value')
  if (icons && icons.isObjectExpression()) {
    const iconExtraction = extract(icons, false, '__icons')
    program.body.push(
      ...(Array.isArray(iconExtraction) ? iconExtraction : [iconExtraction])
    )
    args.push(t.expression.ast`__icons`)
  } else {
    args.push({ type: 'Identifier', name: 'undefined' })
  }

  const iconLoaderUrl = getConfigProperty(opts, 'iconLoaderUrl')?.get('value')
  if (iconLoaderUrl) {
    const urlExtraction = extract(iconLoaderUrl, false, '__iconLoaderUrl')
    program.body.push(
      ...(Array.isArray(urlExtraction) ? urlExtraction : [urlExtraction])
    )
    args.push(t.expression.ast`__iconLoaderUrl`)
  } else {
    args.push({ type: 'Identifier', name: 'undefined' })
  }

  const iconLoader = getConfigProperty(opts, 'iconLoader')?.get('value')
  if (iconLoader) {
    const loaderExtraction = extract(iconLoader, false, '__iconLoader')
    program.body.push(
      ...(Array.isArray(loaderExtraction)
        ? loaderExtraction
        : [loaderExtraction])
    )
    args.push(t.expression.ast`__iconLoader`)
  } else {
    args.push({ type: 'Identifier', name: 'undefined' })
  }

  const exportStatement = t.statement.ast`export const themes = ${createPlugin}`
  program.body.push(exportStatement)
  return program
}

async function createIconConfig(
  opts: ResolvedOptions,
  icon?: string
): Promise<File | Program> {
  if (!icon) {
    // If no icon is provided we are loading the icon plugin.
    return t.program.ast`import { createIconPlugin } from '@formkit/icons'
    export const icons = createIconPlugin()`
  }
  // If there are icon loader considerations we should be prepared for them:
  let iconLoaderPath: NodePath<Node> | undefined = undefined
  let iconLoaderUrlPath: NodePath<Node> | undefined = undefined
  if (opts.configPath) {
    const icons = getConfigProperty(opts, 'icons')
    const value = icons?.get('value')

    // If the icon we are looking for is defined in the config — extract it.
    let iconPath: NodePath<Node> | undefined = undefined
    if (value && value.isObjectExpression()) {
      value.traverse({
        ObjectProperty(path) {
          const keyName = getKeyName(path.get('key'))
          if (keyName === icon) {
            iconPath = path.get('value')
            path.stop()
          }
        },
      })
      if (iconPath) {
        return extract(iconPath, true, icon)
      }
    } else if (icons) {
      consola.warn(
        "[FormKit deopt] cannot statically analyze DefineConfigOptions['icons']. Please use an inline object literal."
      )
    }

    iconLoaderPath = getConfigProperty(opts, 'iconLoader')
    iconLoaderUrlPath = getConfigProperty(opts, 'iconLoaderUrl')
  }

  if (!iconLoaderPath && !iconLoaderUrlPath && opts.builtins.icons) {
    const icons = await import('@formkit/icons')
    if (icon in icons) {
      // We are not using a specialized icon loader, and the icon in in
      // fomrkit’s icon set — load it directly.
      return t.program.ast`export { ${icon} } from '@formkit/icons'`
    } else {
      consola.warn(
        `[FormKit] Unknown icon: "${icon}". It is not a registered or available in @formkit/icons.`
      )
    }
  }

  if ((iconLoaderPath || iconLoaderUrlPath) && opts.configPath) {
    let config: DefineConfigOptions | undefined = undefined
    if (opts.configPath) {
      const configModule = jiti('')(opts.configPath)
      if ('default' in configModule) {
        config =
          typeof configModule.default === 'function'
            ? configModule.default()
            : configModule.default
      }
    }

    if (config && config.iconLoader) {
      const svg = await config.iconLoader(icon)
      if (svg) {
        const svgString: StringLiteral = {
          type: 'StringLiteral',
          value: svg,
        }
        return t.program.ast`export const ${camel(icon)} = ${svgString};`
      }
      consola.warn(
        `[FormKit] Unable to load icon "${icon}" with custom iconLoader.`
      )
    } else if (config && typeof config.iconLoaderUrl === 'function') {
      const url = config.iconLoaderUrl(icon)

      if (typeof url === 'string') {
        const res = await fetch(url)
        if (res.ok) {
          const svg = await res.text()
          if (svg.startsWith('<svg')) {
            const svgString: StringLiteral = {
              type: 'StringLiteral',
              value: svg,
            }
            return t.program.ast`export const ${camel(icon)} = ${svgString};`
          }
        }
      }
      consola.warn('[FormKit] Unable to load icon from URL:', url)
    }
  }
  return t.program.ast`export const ${camel(icon)} = undefined;`
}

/**
 * Create a fully deoptimized default configuration using the legacy
 * `defaultConfig()` function from `@formkit/vue`.
 * @param opts - Resolved options
 * @returns
 */
async function createDefaultConfig(
  opts: ResolvedOptions
): Promise<File | Program> {
  return t.program.ast`import { defaultConfig as d } from '@formkit/vue'
  ${
    opts.configPath
      ? `import config from '${opts.configPath}'`
      : 'const config = {}'
  }
  export const defaultConfig = d(typeof config === 'function' ? config() : config)`
}

async function createBaseConfig(
  opts: ResolvedOptions
): Promise<File | Program> {
  const baseOptions = t.expression.ast`{}` as ObjectExpression
  const nodeConfig = t.expression.ast`{}` as ObjectExpression
  const statements: Statement[] = []
  setLocale(opts, nodeConfig)
  if (!opts.optimize.theme) {
    setRootClasses(opts, statements, nodeConfig)
  }
  setPlugins(opts, statements, baseOptions)
  baseOptions.properties.push(createProperty('config', nodeConfig))
  return t.program.ast`
  import { extend } from '@formkit/utils'
  ${statements}
  const baseOptions = ${baseOptions}
  export const nodeOptions = (o = {}) => extend(baseOptions, o, true)`
}

/**
 * Sets the `locale` property on the config object if it exists.
 * @param component - The component instance
 * @param config - The config object to modify
 */
function setLocale(opts: ResolvedOptions, config: ObjectExpression) {
  const locale = getConfigProperty(opts, 'locale')?.get('value')
  if (locale && locale.isStringLiteral()) {
    config.properties.push(createProperty('locale', locale.node))
  }
}

/**
 * Adds the root classes from the configuration to the nodeOptions import.
 * @param opts - Resolved options
 * @param statements - The statements to add to the program
 * @param config - The config object to modify
 */
function setRootClasses(
  opts: ResolvedOptions,
  statements: Statement[],
  config: ObjectExpression
) {
  const locale = getConfigProperty(opts, 'rootClasses')?.get('value')
  if (locale) {
    const extraction = extract(locale, false, '__rootClasses')
    Array.isArray(extraction)
      ? statements.push(...extraction)
      : statements.push(extraction)
    config.properties.push(
      createProperty('rootClasses', {
        type: 'Identifier',
        name: '__rootClasses',
      })
    )
  }
}

/**
 * Sets the plugins from the configuration to the nodeOptions import.
 * @param opts - Resolved options
 * @param statements - Statements
 * @param baseOptions - Base options
 */
function setPlugins(
  opts: ResolvedOptions,
  statements: Statement[],
  baseOptions: ObjectExpression
) {
  const plugins = getConfigProperty(opts, 'plugins')?.get('value')
  if (plugins) {
    const extraction = extract(plugins, false, '__plugins')
    Array.isArray(extraction)
      ? statements.push(...extraction)
      : statements.push(extraction)
    baseOptions.properties.push(
      createProperty('plugins', { type: 'Identifier', name: '__plugins' })
    )
  }
}

/**
 * Extracts the classes from the given input and creates a configuration for them.
 * @param opts - Resolved options
 * @param input - The input to create the classes for
 */
async function createInputClassesConfig(opts: ResolvedOptions, input: string) {
  const globalClasses = await getGlobalClasses(opts)
  const feats = createFeats()
  await extractUsedFeatures(opts, input, feats)
  const classes = feats.classes

  const matchingGlobalClasses = [...classes]
    .filter((c) => c in globalClasses)
    .map((c) => camel(c))
    .join(', ')

  const statements: Statement[] = [
    t.statement
      .ast`import { createRootClasses } from 'virtual:formkit/optimized-root-classes'`,
  ]
  let globals = t.statement.ast`const globals = {}`

  if (matchingGlobalClasses.length) {
    statements.push(
      t.statement
        .ast`import { ${matchingGlobalClasses} } from 'virtual:formkit/global-classes'`
    )
    globals = t.statement.ast`const globals = { ${matchingGlobalClasses} }`
  }

  const allUsedFamilyClasses = new Set<string>()

  let familyClasses = t.statement.ast`const familyClasses = {}`
  if (feats.families.size) {
    await Promise.all(
      [...feats.families].map(async (family) => {
        const familyClasses = await getFamilyClasses(opts, family)
        const usedFamilyClasses = new Set<string>()
        for (const cls of classes) {
          if (cls in familyClasses) {
            usedFamilyClasses.add(`fam_${family}_${cls}`)
          }
        }
        if (usedFamilyClasses.size) {
          const importName = [...usedFamilyClasses].join(', ')
          const virtualImport = `virtual:formkit/family-classes:${family}`
          statements.push(
            t.statement.ast`import { ${importName} } from '${virtualImport}'`
          )
          usedFamilyClasses.forEach((cls) => allUsedFamilyClasses.add(cls))
        }
      })
    )
  }
  if (allUsedFamilyClasses.size) {
    const allFamilyImports = [...allUsedFamilyClasses].join(', ')
    familyClasses = t.statement
      .ast`const familyClasses = { ${allFamilyImports} }`
  }

  let inputClasses = t.statement.ast`const inputClasses = {}`
  const usedInputClasses = new Set<string>()
  if (feats.inputs.size) {
    await Promise.all(
      [...feats.inputs].map(async (input) => {
        const inputClasses = await getInputClasses(opts, input, feats)
        const usedSectionNames = Object.keys(inputClasses)
        if (usedSectionNames.length) {
          const usedClasses = [...usedSectionNames].map(
            (section) => `input_${input}_${section}`
          )
          const importName = usedClasses.join(', ')
          usedClasses.forEach((cls) => usedInputClasses.add(cls))
          const virtualImport = `virtual:formkit/input-classes:${input}`
          statements.push(
            t.statement.ast`import { ${importName} } from '${virtualImport}'`
          )
        }
      })
    )
  }

  if (usedInputClasses.size) {
    const allInputImports = [...usedInputClasses].join(', ')
    inputClasses = t.statement.ast`const inputClasses = { ${allInputImports} }`
  }

  const exportName = `${camel(input)}Classes`
  return t.program.ast`${statements}
  ${globals}
  ${familyClasses}
  ${inputClasses}
  export const ${exportName} = createRootClasses(globals, familyClasses, inputClasses)`
}

/**
 * Extract the "global" section classes from the configuration and return them as their own module with
 * micro-exports.
 * @param opts - Resolved options
 */
async function createGlobalClassesConfig(
  opts: ResolvedOptions
): Promise<File | Program> {
  const classesBySection = await getGlobalClasses(opts)
  const statements: Statement[] = []
  for (const section in classesBySection) {
    const exportName = camel(section)
    statements.push(
      t.statement.ast`export const ${exportName} = ${JSON.stringify(
        classesBySection[section],
        null,
        2
      )}`
    )
  }

  return t.program.ast`${statements}`
}

/**
 * Fetch the classes that only apply to a given family.
 * @returns
 */
async function createFamilyClassesConfig(
  opts: ResolvedOptions,
  family: string
): Promise<File | Program> {
  const classesBySection = await getFamilyClasses(opts, family)
  const statements: Statement[] = []
  for (const section in classesBySection) {
    const exportName = `fam_${family}_${camel(section)}`
    statements.push(
      t.statement.ast`export const ${exportName} = ${JSON.stringify(
        classesBySection[section],
        null,
        2
      )}`
    )
  }

  return t.program.ast`${statements}`
}

/**
 * Load only the classes we need for this specific input (intentionally does NOT include sub inputs to prevent duplication).
 * @param opts - Resolved optiopns
 * @param input - The input to create the classes for
 * @returns
 */
async function createInputOnlyClassesConfig(
  opts: ResolvedOptions,
  input: string
): Promise<File | Program> {
  const feats = createFeats()
  await extractUsedFeatures(opts, input, feats)

  const classesBySection = await getInputClasses(opts, input, feats)
  const statements: Statement[] = []
  for (const section in classesBySection) {
    const exportName = `input_${input}_${camel(section)}`
    statements.push(
      t.statement.ast`export const ${exportName} = ${JSON.stringify(
        classesBySection[section],
        null,
        2
      )}`
    )
  }

  return t.program.ast`${statements}`
}

/**
 * A factory function for create rootClasses with optimized imports.
 * @returns
 */
async function createRootClassesConfig(): Promise<Program> {
  return t.program.ast`
  export function createRootClasses(globals, familyClasses, inputClasses) {
    return (section, node) => {
      const global = { ...globals[section] } ?? {}
      if (node.props.family) {
        Object.assign(global, familyClasses[\`fam_\${node.props.family}_\${section}\`] ?? {})
      }
      if (node.props.type) {
        Object.assign(global, inputClasses[\`input_\${node.props.type}_\${section}\`] ?? {})
      }
      return global
    }
  }
  `
}

async function createProPluginConfig(
  opts: ResolvedOptions
): Promise<File | Program> {
  const proKey = await getProKey(opts)
  return t.program.ast`import { createProPlugin } from '@formkit/pro'
  export const inputs = {}
  export const proPlugin = createProPlugin('${proKey}', inputs)`
}

async function createProInputConfig(input: string) {
  return t.program.ast`import { inputs } from 'virtual:formkit/pro'
  import { ${input} } from '@formkit/pro'
  inputs['${input}'] = ${input}
  export { ${input} }
  `
}
