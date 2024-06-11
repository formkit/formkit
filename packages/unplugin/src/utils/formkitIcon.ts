import type { ObjectExpression } from '@babel/types'
import type { ComponentUse } from '../types'
import tcjs from '@babel/template'
import type { NodePath } from '@babel/traverse'
import { camel } from '@formkit/vue/utils'
import { addImport } from './ast'
const t: typeof tcjs = ('default' in tcjs ? tcjs.default : tcjs) as typeof tcjs

export function configureFormKitIconInstance(component: ComponentUse) {
  const props = component.path.get('arguments.1') as NodePath<ObjectExpression>
  if (!props || Array.isArray(props) || !props.isObjectExpression()) {
    component.path.node.arguments[1] = t.expression.ast`{}`
  }
  const icon = props.get('properties').find((prop) => {
    const key = prop.get('key')
    if (!key || Array.isArray(key)) return false
    if (
      key.isIdentifier({ name: 'icon' }) ||
      key.isStringLiteral({ value: 'icon' })
    ) {
      return true
    }
    return false
  })
  const value = icon?.get('value')
  if (value && !Array.isArray(value) && value.isStringLiteral()) {
    const iconName = value.node.value

    if (!iconName.startsWith('<svg ')) {
      // In this case we have an iconName and we need to load that icon.
      const importName = addImport(component.opts, component.root, {
        from: `virtual:formkit/icons:${iconName}`,
        name: camel(iconName),
      })
      value.replaceWith({
        type: 'Identifier',
        name: importName,
      })
    }
  }
}
