import type { ComponentUse } from '../types'
import type { ObjectExpression } from '@babel/types'
import { addImport, rootPath, createProperty } from './ast'
import t from '@babel/template'

/**
 * Given a component, create a config object that can be used to configure it.
 * @param component - The component to create a config object for.
 */
export function createConfigObject(component: ComponentUse): ObjectExpression {
  const config = t.expression.ast`{}` as ObjectExpression
  const bindingsVar = addImport(
    component.traverse,
    rootPath(component.path).node,
    {
      from: '@formkit/vue',
      name: 'bindings',
    }
  )
  const plugins = t.expression.ast`[${bindingsVar}]`
  if (component.from === '@formkit/vue' && component.name === 'FormKit') {
    // This is an actual FormKit component, so we should inject the type.
  }
  config.properties.push(createProperty('plugins', plugins))
  return config
}
