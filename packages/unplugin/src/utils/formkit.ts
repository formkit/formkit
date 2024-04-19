import type { ComponentUse } from '../types'
import type {
  ObjectExpression,
  ObjectProperty,
  StringLiteral,
  ArrayExpression,
} from '@babel/types'
import { addImport, createProperty } from './ast'
import t from '@babel/template'
import { consola } from 'consola'
/**
 * Modify the arguments of the usage of a formkit component. For example the
 * ComponentUse may be AST that maps to:
 * ```js
 * createVNode(FormKit, { type: 'text' })
 * ```
 * @param component - The component to configure.
 */
export function configureFormKitInstance(component: ComponentUse): void {
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

/**
 * Given a component, create a config object that can be used to configure it.
 * @param component - The component to create a config object for.
 */
export function createConfigObject(component: ComponentUse): ObjectExpression {
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
      prop.type === 'ObjectProperty' &&
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
