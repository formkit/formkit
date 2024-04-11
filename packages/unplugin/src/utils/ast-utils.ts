import type { Node } from '@babel/types'
import type { Traverse, Component } from '../types'
/**
 * Locate the `resolveComponent` import name in the code (if it is there).
 */
export function getResolveComponentImport(traverse: Traverse, ast: Node) {
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

export function usesComponent(
  traverse: Traverse,
  ast: Node,
  component: Component
) {
  // To come
}
