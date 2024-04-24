import type { ComponentUse } from '../types'
import type {
  ObjectExpression,
  ObjectProperty,
  StringLiteral,
  ArrayExpression,
} from '@babel/types'
import {
  isArrayExpression,
  isObjectProperty,
  isStringLiteral,
} from '@babel/types'
import { addImport, createProperty } from './ast'
import t from '@babel/template'
import { consola } from 'consola'
import { getConfigProperty } from './config'
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
  props.push({
    type: 'ObjectProperty',
    computed: false,
    shorthand: false,
    key: {
      type: 'Identifier',
      name: '__config__',
    },
    value: await createConfigObject(component),
  })
}

/**
 * Given a component, create a config object that can be used to configure it.
 * @param component - The component to create a config object for.
 */
export async function createConfigObject(
  component: ComponentUse
): Promise<ObjectExpression> {
  const config = t.expression.ast`{}` as ObjectExpression

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
  importInputType(component, props, plugins)
  // Inject the validation plugin and any rules
  const rules = await importValidation(component, props, plugins)
  // Import the necessary i18n locales
  await importLocales(component, props, plugins, rules)
  // Set the locale from the config object
  await setLocale(component, config)
  return config
}

/**
 * Import the input type directly into the component.
 * @param component - The component to import the input type into.
 * @param props - The props object to modify.
 * @param plugins - The plugins array to modify.
 */
function importInputType(
  component: ComponentUse,
  props: ObjectExpression,
  plugins: ArrayExpression
): void {
  const inputType = props.properties.find(
    (prop) =>
      isObjectProperty(prop) &&
      prop.key.type === 'Identifier' &&
      prop.key.name === 'type'
  ) as ObjectProperty | undefined

  let libName: string
  // Perform an optimized import, directly replacing the type property if possible.
  if (!inputType || inputType.value.type === 'StringLiteral') {
    const value = inputType ? (inputType.value as StringLiteral).value : 'text'
    libName = addImport(component.opts, component.root, {
      from: 'virtual:formkit/inputs:' + value,
      name: 'library',
    })
  } else {
    consola.warn(
      '[FormKit]: Input uses bound "type" prop, skipping optimization.'
    )
    libName = addImport(component.opts, component.root, {
      from: 'virtual:formkit/library',
      name: 'library',
    })
  }
  plugins.elements.push(t.expression.ast`${libName}`)
}

/**
 * Import the validation plugin and any rules into the component.
 */
async function importValidation(
  component: ComponentUse,
  props: ObjectExpression,
  plugins: ArrayExpression
) {
  const validationProp = props.properties.find(
    (prop) =>
      isObjectProperty(prop) &&
      prop.key.type === 'Identifier' &&
      prop.key.name === 'validation'
  ) as ObjectProperty | undefined
  if (!validationProp) return

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
  }

  if (usedRules.size) {
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
    props.properties.push(createProperty('__rules__', rulesObject))
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
  props: ObjectExpression,
  plugins: ArrayExpression,
  rules: Set<string> | undefined
) {
  if (rules && rules.size /*|| inputLocalizations */) {
    const plugin = addImport(component.opts, component.root, {
      from: 'virtual:formkit/i18n',
      name: 'i18n',
    })
    plugins.elements.push(t.expression.ast`${plugin}`)

    const messages = [...rules]
    // Import the validation plugin
    const locales = addImport(component.opts, component.root, {
      from: `virtual:formkit/locales:${messages.join(',')}`,
      name: 'locales',
    })
    props.properties.push(
      createProperty('__locales__', t.expression.ast`${locales}`)
    )
  }
}

/**
 * Sets the `locale` property on the config object if it exists.
 * @param component - The component instance
 * @param config - The config object to modify
 */
function setLocale(component: ComponentUse, config: ObjectExpression) {
  const locale = getConfigProperty(component.opts, 'locale')?.get('value')
  if (locale && locale.isStringLiteral()) {
    config.properties.push(createProperty('locale', locale.node))
  }
}
