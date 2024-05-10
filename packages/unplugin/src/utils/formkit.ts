import type { ComponentUse, ResolvedOptions } from '../types'
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
  isObjectProperty,
  isSpreadElement,
  isStringLiteral,
} from '@babel/types'
import { addImport, createProperty, getKeyName } from './ast'
import t from '@babel/template'
import { consola } from 'consola'
import { isFullDeopt } from './config'
import { createVirtualInputConfig } from '../hooks/load'
import { camel } from '@formkit/utils'
import type {
  FormKitSchemaDefinition,
  FormKitTypeDefinition,
} from '@formkit/core'
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
  if (component.from === '@formkit/vue' && component.name === 'FormKit') {
    // This is an actual FormKit component, so we should inject the type.
  }
  config.properties.push(createProperty('plugins', plugins))
  const props = component.path.node.arguments[1] as ObjectExpression
  // Perform a direct-injection on the input type (if possible)
  const [localizations, icons] = await importInputType(
    component,
    props,
    plugins
  )
  // Inject the validation plugin and any rules
  const rules = await importValidation(component, props, nodeProps, plugins)
  // Import the necessary i18n locales
  await importLocales(
    component,
    nodeProps,
    plugins,
    new Set([...rules, ...localizations])
  )
  await importIcons(component, plugins, props, icons)

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
): Promise<[Set<string>, Record<string, string>]> {
  const localizations = new Set<string>()
  const icons: Record<string, string> = {}
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
    await extractLocalizationsAndIcons(
      component.opts,
      value,
      localizations,
      icons
    )
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
  return [localizations, icons]
}

/**
 * Import the validation plugin and any rules into the component.
 */
async function importValidation(
  component: ComponentUse,
  props: ObjectExpression,
  nodeProps: ObjectExpression,
  plugins: ArrayExpression
) {
  const opts = component.opts
  let localDeopt = false
  const validationProp = props.properties.find(
    (prop) =>
      isObjectProperty(prop) &&
      prop.key.type === 'Identifier' &&
      prop.key.name === 'validation'
  ) as ObjectProperty | undefined
  if (!validationProp) return new Set<string>()

  const usedRules = new Set<string>()
  if (isStringLiteral(validationProp.value)) {
    // Import the rules directly.
    const { extractRules } = await import('@formkit/validation')
    const rules = extractRules(validationProp.value.value) as string[][]
    rules.forEach(([ruleName]) => usedRules.add(ruleName))
  } else if (isArrayExpression(validationProp.value)) {
    validationProp.value.elements.forEach((rule) => {
      if (isArrayExpression(rule)) {
        const [ruleName] = rule.elements
        if (isStringLiteral(ruleName)) {
          usedRules.add(ruleName.value)
        }
      }
    })
  } else if (opts.optimize.validation) {
    localDeopt = true
    consola.warn(
      '[FormKit deopt]: Cannot statically analyze validation prop, deoptimizing rules.'
    )
  }

  if (usedRules.size && opts.optimize.validation) {
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
    // Import the validation plugin
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
async function extractLocalizationsAndIcons(
  opts: ResolvedOptions,
  input: string,
  localizations: Set<string>,
  icons: Record<string, string>
): Promise<void> {
  const inputDefinition = await loadInputDefinition(opts, input)
  if (inputDefinition && typeof inputDefinition === 'object') {
    if ('localize' in inputDefinition) {
      const localize = inputDefinition.localize
      if (Array.isArray(localize)) {
        localize.forEach(localizations.add, localizations)
      }
    }
    if ('icons' in inputDefinition) {
      Object.assign(icons, inputDefinition.icons)
    }
  }
}

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
    } else {
      consola.warn(
        `[FormKit de-opt]: Optimizer could not find an import for "${input}". This reduces the optimization of themes, icons, and i18n. To avoid this deoptimization, ensure the input definition is imported (from another module) into formkit.config.ts.`
      )
    }
  } catch (e) {}
  return undefined
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
  plugins: ArrayExpression,
  props: ObjectExpression,
  icons: Record<string, string>
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
    if (isSpreadElement(prop)) return
    const key = isStringLiteral(prop.key)
      ? prop.key.value
      : isIdentifier(prop.key)
      ? prop.key.name
      : undefined
    if (key && key in icons) delete icons[key]
  })
  for (const section in icons) {
    props.properties.push({
      type: 'ObjectProperty',
      computed: false,
      shorthand: false,
      key: {
        type: 'StringLiteral',
        value: `${section}-icon`,
      },
      value: {
        type: 'StringLiteral',
        value: icons[section],
      },
    })
  }
  const iconPaths = new Map<NodePath<ObjectProperty>, string>()
  ;(
    component.path.get('arguments.1') as NodePath<ObjectExpression> | undefined
  )?.traverse({
    ObjectProperty(path) {
      const key = path.get('key')
      const keyName = getKeyName(key)
      if (keyName?.endsWith('-icon') || keyName?.endsWith('Icon')) {
        const value = path.get('value')
        if (
          value.node.type === 'StringLiteral' &&
          !value.node.value.startsWith('<svg')
        ) {
          const iconValue = value.node.value
          iconPaths.set(path, iconValue)
        }
      }
      path.skip()
    },
  })
  if (!iconPaths.size) return
  plugins.elements.push(
    t.expression.ast(
      `${addImport(component.opts, component.root, {
        from: 'virtual:formkit/icons',
        name: 'icons',
      })}`
    )
  )
  iconPaths.forEach((icon, path) => {
    path.get('value').replaceWith({
      type: 'Identifier',
      name: addImport(component.opts, component.root, {
        from: 'virtual:formkit/icons:' + icon,
        name: camel(icon),
      }),
    })
  })
}

/**
 * Extract the input types from a schema object.
 * @param schema - The schema object
 * @returns
 */
export function extractInputTypesFromSchema(
  schema: FormKitSchemaDefinition,
  types = new Set<string>()
): Set<string> {
  if (Array.isArray(schema)) {
    schema.forEach((item) => {
      extractInputTypesFromSchema(item, types)
    })
  }
  if (schema && typeof schema === 'object') {
    if ('$cmp' in schema && schema.$cmp === 'FormKit' && schema.props?.type) {
      types.add(schema.props.type)
    } else if ('$formkit' in schema) {
      types.add(schema.$formkit)
    }
    if ('children' in schema && typeof schema.children === 'object') {
      extractInputTypesFromSchema(schema.children, types)
    }
    if ('then' in schema && typeof schema.then === 'object') {
      extractInputTypesFromSchema(schema.then, types)
    }
    if ('else' in schema && typeof schema.else === 'object') {
      extractInputTypesFromSchema(schema.else, types)
    }
  }
  return types
}
