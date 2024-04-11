import type { Node, NodePath, VariableDeclarator } from '@babel/types'
import type { Traverse, Component, ComponentLocators } from '../types'
/**
 * Locates the `resolveComponent` import name in the code (if it is there).
 */
export function getResolveComponentImport(
  traverse: Traverse,
  ast: Node
): string | undefined {
  let resolveComponentLocaleName: string | undefined
  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === 'vue') {
        const specifier = path.node.specifiers.find(
          (specifier) =>
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            specifier.imported.name === 'resolveComponent'
        )
        if (specifier) {
          resolveComponentLocaleName = specifier.local.name
          path.stop()
        }
      }
    },
  })
  return resolveComponentLocaleName
}

/**
 *
 * @param traverse - The babel/traverse object
 * @param ast - The AST to traverse
 * @param components - The components to search for
 * @param resolveComponentFnName - The local name of the resolveComponent fn
 */
export function usedComponents(
  traverse: Traverse,
  ast: Node,
  components: Component[],
  resolveComponentFnName: string | undefined
): ComponentUse[] {
  const variableLocators: ComponentLocators[] = []

  // Find any calls to resolveComponent() where the component being resolved
  // is a string that matches one of the components we are looking for.
  traverse(ast, {
    CallExpression(path) {
      if (
        path.node.callee.type === 'Identifier' &&
        path.node.callee.name === resolveComponentFnName &&
        path.parentPath.type === 'VariableDeclarator'
      ) {
        const arg = path.node.arguments[0]
        if (arg?.type === 'StringLiteral') {
          const component = components.find((c) => c.name === arg.value)
          if (component) {
            // At this point we‘ve found something like:
            // `const foo = resolveComponent('Foo')`
            const variableName = (
              path.parentPath as NodePath<VariableDeclarator>
            ).node.id.name
            variableLocators.push({
              component,
              retrievedBy: 'variable',
              variableName,
            })
          }
        }
      }
    },
  })

  // Find any calls to createVNode, createBlock, createSSRComponent where the
  // component being resolved
  traverse(ast, {
    CallExpression(path) {
      if (
        path.node.callee.type === 'Identifier' &&
        path.node.callee.name === resolveComponentFnName &&
        path.parentPath.type === 'CallExpression'
      ) {
        const arg = path.node.arguments[0]
        if (arg?.type === 'StringLiteral') {
          const component = components.find((c) => c.name === arg.value)
          if (component) {
            // At this point we‘ve found something like:
            // `resolveComponent('Foo')()`
            variableLocators.push({
              component,
              retrievedBy: 'setup',
            })
          }
        }
      }
    },
  })
}
