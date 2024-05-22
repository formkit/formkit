import type { ComponentUse, ResolvedOptions, UsedFeatures } from '../types'
import type {
  ObjectExpression,
  ObjectProperty,
  StringLiteral,
  ArrayExpression,
  ImportDeclaration,
  Identifier,
  ImportSpecifier,
  ImportDefaultSpecifier,
  Program,
  File,
} from '@babel/types'
import type { NodePath } from '@babel/traverse'
import {
  isArrayExpression,
  isIdentifier,
  isObjectMethod,
  isObjectProperty,
  isSpreadElement,
  isStringLiteral,
} from '@babel/types'
import { addImport, createProperty } from './ast'
import t from '@babel/template'
import { consola } from 'consola'
import { isFullDeopt } from './config'
import { createVirtualInputConfig } from '../hooks/load'
import { camel } from '@formkit/utils'
import type {
  FormKitSchemaDefinition,
  FormKitTypeDefinition,
} from '@formkit/core'
import { dirname, resolve } from 'pathe'
import { unlink, writeFile } from 'fs/promises'
import { randomUUID } from 'crypto'

/**
 * Modify the arguments of the usage of a formkit component. For example the
 * ComponentUse may be AST that maps to:
 * ```js
 * createVNode(FormKit, { type: 'text' })
 * ```
 * @param component - The component to configure.
 */
export async function configureFormKitInstance(
  component: ComponentUse
): Promise<void> {
  if (
    !component.path.node.arguments[1] ||
    component.path.node.arguments[1].type !== 'ObjectExpression'
  ) {
    component.path.node.arguments[1] = t.expression.ast`{}` as ObjectExpression
  }
  const props = component.path.node.arguments[1].properties
  const configObject = await createConfigObject(component)

  props.push({
    type: 'ObjectProperty',
    computed: false,
    shorthand: false,
    key: {
      type: 'Identifier',
      name: '__config__',
    },
    value: await baseConfig(component, configObject),
  })
}

export async function baseConfig(
  component: ComponentUse,
  config: ObjectExpression | Identifier
) {
  // If there is no config file, no need to wrap the config in a function.
  if (!component.opts.configAst) return config
  // If this is an identifier, then we are using the full deopt. In this case
  // we just return the identifier since it is already the defaultConfig.
  if (config.type === 'Identifier') return config
  const nodeOptions = addImport(component.opts, component.root, {
    from: 'virtual:formkit/nodeOptions',
    name: 'nodeOptions',
  })
  return t.expression.ast`${nodeOptions}(${config})`
}

/**
 * Given a component, create a config object that can be used to configure it.
 * @param component - The component to create a config object for.
 */
export async function createConfigObject(
  component: ComponentUse
): Promise<ObjectExpression | Identifier> {
  if (isFullDeopt(component.opts)) {
    consola.warn('[FormKit deopt]: Full configuration deoptimization')
    return {
      type: 'Identifier',
      name: addImport(component.opts, component.root, {
        from: 'virtual:formkit/defaultConfig',
        name: 'defaultConfig',
      }),
    }
  }

  const config = t.expression.ast`{}` as ObjectExpression
  const nodeProps = t.expression.ast`{}` as ObjectExpression

  const bindingsVar = addImport(component.opts, component.root, {
    from: '@formkit/vue',
    name: 'bindings',
  })
  const plugins = t.expression.ast`[${bindingsVar}]` as ArrayExpression

  config.properties.push(createProperty('plugins', plugins))
  const props = component.path.node.arguments[1] as ObjectExpression

  // Perform a direct-injection on the input type (if possible)
  const feats = await importInputType(component, props, plugins)
  // Inject the validation plugin and any rules
  await importValidation(component, props, nodeProps, plugins, feats.rules)

  // Import the necessary i18n locales
  await importLocales(
    component,
    nodeProps,
    plugins,
    new Set([...feats.rules, ...feats.localizations])
  )

  await importIcons(component, nodeProps, plugins, props, feats.icons)

  if (nodeProps.properties.length) {
    config.properties.push(createProperty('props', nodeProps))
  }
  return config
}

/**
 * Import the input type directly into the component.
 * @param component - The component to import the input type into.
 * @param props - The props object to modify.
 * @param plugins - The plugins array to modify.
 */
async function importInputType(
  component: ComponentUse,
  props: ObjectExpression,
  plugins: ArrayExpression
): Promise<UsedFeatures> {
  const feats = createFeats()
  const inputType = props.properties.find(
    (prop) =>
      isObjectProperty(prop) &&
      prop.key.type === 'Identifier' &&
      prop.key.name === 'type'
  ) as ObjectProperty | undefined

  let libName: string
  const shouldOptimize = component.opts.optimize.inputs
  if (
    shouldOptimize &&
    (!inputType || inputType.value.type === 'StringLiteral')
  ) {
    const value = inputType ? (inputType.value as StringLiteral).value : 'text'
    libName = addImport(component.opts, component.root, {
      from: 'virtual:formkit/inputs:' + value,
      name: 'library',
    })
    await extractUsedFeatures(component.opts, value, feats)
  } else {
    if (shouldOptimize) {
      // We wanted to optimize, but couldn’t.
      consola.warn(
        '[FormKit]: Input uses bound "type" prop, skipping optimization.'
      )
    }
    libName = addImport(component.opts, component.root, {
      from: 'virtual:formkit/library',
      name: 'library',
    })
  }
  plugins.elements.push(t.expression.ast`${libName}`)
  return feats
}

/**
 * Import the validation plugin and any rules into the component.
 */
async function importValidation(
  component: ComponentUse,
  props: ObjectExpression,
  nodeProps: ObjectExpression,
  plugins: ArrayExpression,
  usedRules = new Set<string>()
) {
  const opts = component.opts
  let localDeopt = false
  const validationProp = props.properties.find(
    (prop) =>
      isObjectProperty(prop) &&
      prop.key.type === 'Identifier' &&
      prop.key.name === 'validation'
  ) as ObjectProperty | undefined

  const { extractRules, parseHints } = await import('@formkit/validation')

  if (validationProp && isStringLiteral(validationProp.value)) {
    // Import the rules directly.
    const rules = extractRules(validationProp.value.value) as string[][]
    rules.forEach(([name]) => {
      const [ruleName] = parseHints(name)
      usedRules.add(ruleName)
    })
  } else if (validationProp && isArrayExpression(validationProp.value)) {
    validationProp.value.elements.forEach((rule) => {
      if (isArrayExpression(rule)) {
        const [name] = rule.elements
        if (isStringLiteral(name)) {
          const [ruleName] = parseHints(name.value)
          usedRules.add(ruleName)
        }
      }
    })
  } else if (validationProp && opts.optimize.validation) {
    localDeopt = true
    consola.warn(
      '[FormKit deopt]: Cannot statically analyze validation prop, deoptimizing rules.'
    )
  }

  // If there are no validations by the time we get here, we can skip this.
  if (!usedRules.size && !validationProp) return

  if (opts.optimize.validation) {
    const rulesObject = t.expression.ast`{}` as ObjectExpression
    usedRules.forEach((rule) => {
      rulesObject.properties.push(
        createProperty(
          rule,
          t.expression.ast`${addImport(component.opts, component.root, {
            from: 'virtual:formkit/rules:' + rule,
            name: rule,
          })}`
        )
      )
    })
    nodeProps.properties.push(createProperty('__rules__', rulesObject))
  } else if (localDeopt || !opts.optimize.validation) {
    // Load de-optimized rules
    nodeProps.properties.push(
      createProperty(
        '__rules__',
        t.expression.ast`${addImport(opts, component.root, {
          from: 'virtual:formkit/rules',
          name: 'rules',
        })}`
      )
    )
  }

  // Import the validation plugin
  const validationVar = addImport(component.opts, component.root, {
    from: 'virtual:formkit/validation',
    name: 'validation',
  })

  plugins.elements.push(t.expression.ast`${validationVar}`)
  return usedRules
}

/**
 * Import the locale messages required to render the component and its
 * validation rules.
 */
function importLocales(
  component: ComponentUse,
  nodeProps: ObjectExpression,
  plugins: ArrayExpression,
  messageKeys: Set<string> | undefined
) {
  if (component.opts.optimize.i18n === false) {
    // We are de-optimizing the i18n configuration.
    const plugin = addImport(component.opts, component.root, {
      from: 'virtual:formkit/i18n',
      name: 'i18n',
    })
    plugins.elements.push(t.expression.ast`${plugin}`)
    const locales = addImport(component.opts, component.root, {
      from: `virtual:formkit/locales`,
      name: 'locales',
    })
    nodeProps.properties.push(
      createProperty('__locales__', t.expression.ast`${locales}`)
    )
  } else if (messageKeys && messageKeys.size) {
    // This is the ideal case, we can statically analyze the messages
    // and ensure only those are imported.
    const plugin = addImport(component.opts, component.root, {
      from: 'virtual:formkit/i18n',
      name: 'i18n',
    })
    plugins.elements.push(t.expression.ast`${plugin}`)

    const messages = [...messageKeys]
    // Import the locales required for this component.
    const locales = addImport(component.opts, component.root, {
      from: `virtual:formkit/locales:${messages.join(',')}`,
      name: 'locales',
    })
    nodeProps.properties.push(
      createProperty('__locales__', t.expression.ast`${locales}`)
    )
  }
}

/**
 * Extract the localizations from a given module.
 * @param identifier - The identifier to extract localizations from.
 * @param localizations - The set to add localizations to.
 */
async function extractUsedFeatures(
  opts: ResolvedOptions,
  input: string,
  feats: UsedFeatures
): Promise<void> {
  const inputDefinition = await loadInputDefinition(opts, input)
  if (inputDefinition && typeof inputDefinition === 'object') {
    if ('localize' in inputDefinition) {
      const localize = inputDefinition.localize
      if (Array.isArray(localize)) {
        localize.forEach(feats.localizations.add, feats.localizations)
      }
    }
    if (
      'icons' in inputDefinition &&
      typeof inputDefinition.icons === 'object'
    ) {
      Object.values(inputDefinition.icons).forEach((icon) =>
        feats.icons.add(icon)
      )
    }
    if ('schema' in inputDefinition) {
      let schema: FormKitSchemaDefinition | undefined = undefined
      if (Array.isArray(inputDefinition.schema)) {
        schema = inputDefinition.schema
      } else if (typeof inputDefinition.schema === 'function') {
        schema = inputDefinition.schema({})
      } else if (typeof inputDefinition.schema === 'object') {
        schema = inputDefinition.schema
      }
      await extractUsedFeaturesInSchema(schema, feats, opts)
    }
  }
}

/**
 * Attempts to load an input definition for a given input "type" as defined in the formkit config.
 * @param opts - Resolved options
 * @param input - The "name" of the input to load as defined in the configuration.
 * @param ast - Optionally, attempt to load the input definition from an AST.
 * @returns
 */
export async function loadInputDefinition(
  opts: ResolvedOptions,
  input: string,
  ast?: File | Program
): Promise<FormKitTypeDefinition | undefined> {
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
        const module = await import(importNode.source.value)
        if (importName in module) {
          return module[importName] as FormKitTypeDefinition
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
        return definition
      }
    } else {
      consola.warn(
        `[FormKit de-opt]: Optimizer could not find an import for "${input}". This reduces the optimization of themes, icons, and i18n. To avoid this deoptimization, ensure the input definition is imported (from another module) into formkit.config.ts.`
      )
    }
  } catch (e) {
    consola.info(
      `[FormKit de-opt]: Optimizer encountered an error when loading input definition for "${input}".`,
      e
    )
  }
  return undefined
}

/**
 * Generates a temporary file, imports it, then deletes it.
 * @param opts - The resolved options.
 * @param ast - AST to load.
 * @returns
 */
async function loadFromAST(opts: ResolvedOptions, ast: File | Program) {
  const source = opts.generate(ast)
  const dir = dirname(opts.configPath ?? process.cwd())
  const path = resolve(dir, `./${randomUUID()}.mjs`)
  await writeFile(path, source.code, 'utf-8')
  const value = await import(path)
  await unlink(path)
  return value
}

/**
 * When importing icons we need to add the icon plugin, and import the icon from
 * a virtual module then replace the prop with the imported value.
 * @param component - The component to import icons for.
 * @param plugins - The plugins array to modify.
 * @param icons - Default we need to apply to given sections.
 * @returns
 */
async function importIcons(
  component: ComponentUse,
  nodeProps: ObjectExpression,
  plugins: ArrayExpression,
  props: ObjectExpression,
  icons: Set<string>
) {
  if (!component.opts.optimize.icons) {
    // In this case we are de-optimizing the icon configuration so we load the
    // the legacy @formkit/themes plugin instead:
    const plugin = addImport(component.opts, component.root, {
      from: 'virtual:formkit/themes',
      name: 'themes',
    })
    plugins.elements.push(t.expression.ast`${plugin}`)
    return
  }
  // Perform an optimized icon load:
  props.properties.forEach((prop) => {
    if (isSpreadElement(prop) || isObjectMethod(prop)) return
    const key = isStringLiteral(prop.key)
      ? prop.key.value
      : isIdentifier(prop.key)
      ? prop.key.name
      : undefined
    if (key?.endsWith('-icon') || key?.endsWith('Icon')) {
      const value = isStringLiteral(prop.value) ? prop.value.value : undefined
      if (value && !value.startsWith('<svg')) {
        icons.add(value)
      }
    }
  })
  if (icons.size) {
    // Inject the icon loader:
    plugins.elements.push(
      t.expression.ast(
        `${addImport(component.opts, component.root, {
          from: 'virtual:formkit/icons',
          name: 'icons',
        })}`
      )
    )
    // Now create the icon configuration:
    const iconConfig = t.expression.ast`{}` as ObjectExpression
    icons.forEach((icon) => {
      if (icon && icon.startsWith('<svg')) {
        iconConfig.properties.push(
          createProperty(icon, { type: 'StringLiteral', value: icon })
        )
      } else {
        iconConfig.properties.push(
          createProperty(
            icon,
            t.expression.ast`${addImport(component.opts, component.root, {
              from: 'virtual:formkit/icons:' + icon,
              name: camel(icon),
            })}`
          )
        )
      }
    })
    nodeProps.properties.push(createProperty('__icons__', iconConfig))
  }
}

/**
 * Extract the input types from a schema object.
 * @param schema - The schema object
 * @returns
 */
export async function extractInputTypesFromSchema(
  schema: FormKitSchemaDefinition,
  inputs: Set<string> = new Set()
): Promise<Set<string>> {
  await extractUsedFeaturesInSchema(schema, createFeats({ inputs }))
  return inputs
}

/**
 *
 * @param schema - Schema object to recurse through
 * @param localizations - Localizations
 * @param icons - Icons
 * @param rules
 * @returns
 */
export async function extractUsedFeaturesInSchema(
  schema: FormKitSchemaDefinition | undefined,
  feats: UsedFeatures,
  opts?: ResolvedOptions
): Promise<void> {
  if (Array.isArray(schema)) {
    await Promise.all(
      schema.map((item) => extractUsedFeaturesInSchema(item, feats, opts))
    )
  }
  if (schema && typeof schema === 'object') {
    if (
      ('$cmp' in schema && schema.$cmp === 'FormKit') ||
      '$formkit' in schema
    ) {
      const inputType: string =
        ('$formkit' in schema ? schema.$formkit : schema.props?.type) ?? 'text'
      const props: Record<string, any> =
        ('$formkit' in schema ? schema : schema.props) ?? {}

      // Extract the validation rules from the schema.
      if ('validation' in props) {
        if (
          typeof props.validation === 'string' &&
          props.validation.startsWith('$')
        ) {
          consola.warn(
            '[FormKit] Dynamic validation rules are not supported in optimizer.'
          )
        }
        extractValidationRules(props.validation, feats.rules)
      }

      // Extract props that are icons.
      for (const key in props) {
        if (key.endsWith('-icon') || key.endsWith('Icon')) {
          const value = props[key]
          if (typeof value === 'string' && !value.startsWith('<svg')) {
            feats.icons.add(value)
          }
        }
      }

      if (!feats.inputs.has(inputType)) {
        feats.inputs.add(inputType)
        if (opts) {
          // Recursively fetch any features from this identified input.
          await extractUsedFeatures(opts, inputType, feats)
        }
      }
    }
    if ('meta' in schema && typeof schema.meta?.section === 'string') {
      feats.sections.add(schema.meta.section)
    }
    if ('children' in schema && typeof schema.children === 'object') {
      await extractUsedFeaturesInSchema(schema.children, feats, opts)
    }
    if ('then' in schema && typeof schema.then === 'object') {
      await extractUsedFeaturesInSchema(schema.then, feats, opts)
    }
    if ('else' in schema && typeof schema.else === 'object') {
      await extractUsedFeaturesInSchema(schema.else, feats, opts)
    }
  }
}

/**
 * Extract the validation rules from a validation string or array.
 * @param validation - The validation string or array to extract rules from.
 * @param rules - The set to add rules to.
 */
async function extractValidationRules(
  validation: string | [[string]],
  rules: Set<string>
) {
  const { extractRules, parseHints } = await import('@formkit/validation')
  if (typeof validation === 'string') {
    const rulesArray = extractRules(validation)
    rulesArray.forEach(([name]) => {
      if (typeof name === 'string') {
        const [ruleName] = parseHints(name)
        rules.add(ruleName)
      }
    })
  } else if (Array.isArray(validation)) {
    validation.forEach((rule) => {
      if (Array.isArray(rule)) {
        const [name] = rule
        if (typeof name === 'string') {
          const [ruleName] = parseHints(name)
          rules.add(ruleName)
        }
      }
    })
  }
}

/**
 * Creates a new used features object.
 * @returns
 */
export function createFeats(initial: Partial<UsedFeatures> = {}): UsedFeatures {
  return {
    localizations: new Set(),
    icons: new Set(),
    rules: new Set(),
    inputs: new Set(),
    sections: new Set(),
    ...initial,
  }
}
