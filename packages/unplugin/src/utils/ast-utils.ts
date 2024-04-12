import type { Node, VariableDeclarator, Program } from '@babel/types'
import type { NodePath } from '@babel/traverse'
import type {
  Traverse,
  Component,
  ComponentUse,
  Import,
  LocalizedImport,
} from '../types'

/**
 * Locates the local names for the imported vue functions.
 */
export function getUsedImports(
  traverse: Traverse,
  ast: Node,
  imports: Import[]
): LocalizedImport[] {
  const localizedImports: LocalizedImport[] = []
  const remappedImports = imports.reduce((map, imp) => {
    map[imp.from] ??= []
    map[imp.from].push(imp.name)
    return map
  }, {} as Record<string, string[]>)
  traverse(ast, {
    ImportDeclaration(path) {
      path.node.specifiers.forEach((specifier) => {
        if (
          path.node.source.value in remappedImports &&
          specifier.type === 'ImportSpecifier' &&
          specifier.imported.type === 'Identifier' &&
          remappedImports[path.node.source.value].includes(
            specifier.imported.name
          )
        ) {
          localizedImports.push({
            name: specifier.imported.name,
            from: path.node.source.value,
            local: specifier.local.name,
          })
        }
      })
    },
  })
  return localizedImports
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
  components: Component[]
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
          })
          // In this case we have located a component being used in a render
          // function that was previously resolved by resolveComponent to a
          // variable.
        }
      }
    },
  })
  return componentUses
}

/**
 * Recursively walk up the path to find the root path.
 * @param path - The path to find the root of
 * @returns
 */
export function rootPath(path: NodePath<any>): NodePath<Program> {
  if (path.parentPath) {
    return rootPath(path.parentPath)
  }
  return path
}
