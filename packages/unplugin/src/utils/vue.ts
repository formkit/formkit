import { getUsedImports, addImport, rootPath } from './ast'
import t from '@babel/template'
import type { Component, ComponentUse, Traverse } from '../types'
import type { Program, File, VariableDeclarator } from '@babel/types'
import type { NodePath } from '@babel/traverse'

/**
 * Checks if a given set of components are being used in a vue (post-processed)
 * file.
 * @param traverse - The babel/traverse object
 * @param ast - The AST to traverse
 * @param components - The components to search for
 * @param resolveComponentFnName - The local name of the resolveComponent fn
 * @param autoImport - If located, automatically import any resolveComponent calls
 */
export function usedComponents(
  traverse: Traverse,
  ast: Program | File,
  components: Component[],
  autoImport = false
): ComponentUse[] {
  const variableLocators: Record<string, Component> = {}
  const localImports = getUsedImports(traverse, ast, [
    { name: 'resolveComponent', from: 'vue' },
    { name: 'createVNode', from: 'vue' },
    { name: 'createBlock', from: 'vue' },
    { name: 'ssrRenderComponent', from: 'vue' },
    { name: 'h', from: 'vue' },
  ])
  const { resolveComponent, ...renderFns } = localImports.reduce((map, imp) => {
    map[imp.name] = imp.local
    return map
  }, {} as Record<string, string>)

  // Find any calls to resolveComponent() where the component being resolved
  // is a string that matches one of the components we are looking for.
  if (resolveComponent) {
    traverse(ast, {
      CallExpression(path) {
        if (
          path.node.callee.type === 'Identifier' &&
          path.node.callee.name === resolveComponent &&
          path.parentPath.type === 'VariableDeclarator'
        ) {
          const arg = path.node.arguments[0]
          if (arg?.type === 'StringLiteral') {
            const component = components.find((c) => c.name === arg.value)
            if (component) {
              const identifier = (
                path.parentPath as NodePath<VariableDeclarator>
              ).node.id
              if (identifier.type === 'Identifier') {
                variableLocators[identifier.name] = component
              }
              if (autoImport) {
                const localName = addImport(
                  traverse,
                  rootPath(path).node,
                  component
                )
                path.replaceWith(t.expression.ast(localName))
              }
            }
          }
        }
      },
    })
  }

  // Find any calls to createVNode, createBlock, createSSRComponent where the
  // component being resolved
  const renderFnNames = Object.values(renderFns)
  const componentUses: ComponentUse[] = []
  traverse(ast, {
    CallExpression(path) {
      if (
        path.node.callee.type === 'Identifier' &&
        renderFnNames.includes(path.node.callee.name)
      ) {
        if (
          path.node.arguments[0]?.type === 'Identifier' &&
          path.node.arguments[0]?.name in variableLocators
        ) {
          const component = variableLocators[path.node.arguments[0].name]
          componentUses.push({
            ...component,
            path,
            traverse,
          })
        }
      }
    },
  })
  return componentUses
}
