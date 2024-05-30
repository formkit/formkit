import type { ComponentUse, ResolvedOptions, UsedFeatures } from '../types'
import type {
  ObjectExpression,
  ObjectProperty,
  StringLiteral,
  ArrayExpression,
  Identifier,
} from '@babel/types'

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
import { isFullDeopt, getInputDefinition } from './config'
import { camel } from '@formkit/utils'
import type { FormKitSchemaDefinition } from '@formkit/core'

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
  const inputType = feats.inputs.values().next().value
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

  await importClasses(component, config, inputType)

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
    feats.inputs.add(value)
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
 * Import the rootClasses for the given input type.
 */
async function importClasses(
  component: ComponentUse,
  config: ObjectExpression,
  inputType?: string
) {
  if (!inputType || !component.opts.optimize.theme) return
  const classes = addImport(component.opts, component.root, {
    from: 'virtual:formkit/classes:' + inputType,
    name: `${camel(inputType)}Classes`,
  })
  const configConfig = t.expression.ast`{}` as ObjectExpression
  configConfig.properties.push(
    createProperty('rootClasses', t.expression.ast`${classes}`)
  )
  config.properties.push(createProperty('config', configConfig))
}

/**
 * Extract the localizations from a given module.
 * @param identifier - The identifier to extract localizations from.
 * @param localizations - The set to add localizations to.
 */
export async function extractUsedFeatures(
  opts: ResolvedOptions,
  input: string,
  feats: UsedFeatures
): Promise<void> {
  feats.inputs.add(input)
  const inputDefinition = await getInputDefinition(opts, input)
  if (inputDefinition && typeof inputDefinition === 'object') {
    if (typeof inputDefinition.family === 'string') {
      feats.families.add(inputDefinition.family)
    }
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
      for (const iconUseName in inputDefinition.icons) {
        const icon = inputDefinition.icons[iconUseName]
        const useNames = feats.icons.get(icon) ?? new Set()
        useNames.add(iconUseName)
        feats.icons.set(icon, useNames)
      }
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
 * When importing icons we need to add the icon plugin, and import the icon from
 * a virtual module then replace the prop with the imported value.
 * @param component - The component to import icons for.
 * @param plugins - The plugins array to modify.
 * @param icons - Default we need to apply to given classes.
 * @returns
 */
async function importIcons(
  component: ComponentUse,
  nodeProps: ObjectExpression,
  plugins: ArrayExpression,
  props: ObjectExpression,
  icons: Map<string, Set<string>>
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
        const uses = icons.get(value) ?? new Set()
        uses.add(value)
        icons.set(value, uses)
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
    icons.forEach((uses, icon) => {
      if (icon && icon.startsWith('<svg')) {
        iconConfig.properties.push(
          createProperty(icon, { type: 'StringLiteral', value: icon })
        )
      } else {
        const iconImportName = addImport(component.opts, component.root, {
          from: 'virtual:formkit/icons:' + icon,
          name: camel(icon),
        })
        uses.forEach((useName) => {
          iconConfig.properties.push(
            createProperty(useName, t.expression.ast`${iconImportName}`)
          )
        })
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
            const uses = feats.icons.get(value) ?? new Set()
            uses.add(value)
            feats.icons.set(value, uses)
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

    // Extract instances of $classes.{name}
    if ('attrs' in schema && typeof schema.attrs.class === 'string') {
      extractClassName(schema.attrs.class, feats.classes)
    } else if ('props' in schema && typeof schema.props.class === 'string') {
      extractClassName(schema.props.class, feats.classes)
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
 * Extract the class names from a class string.
 * @param className - The class name to extract from.
 * @param classes - The set to add classes to.
 */
function extractClassName(className: string, classes: Set<string>) {
  const matches = className.matchAll(/\$classes\.([a-zA-Z_\-0-9]+)/g)
  if (matches) {
    for (const match of matches) {
      classes.add(match[1])
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
    icons: new Map(),
    rules: new Set(),
    inputs: new Set(),
    families: new Set(),
    classes: new Set(),
    ...initial,
  }
}
