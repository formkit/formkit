import { getUsedImports, addImport, rootPath } from './ast'
import t from '@babel/template'
import type { ResolvedOptions, Component, ComponentUse } from '../types'
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
  opts: ResolvedOptions,
  id: string,
  ast: Program | File,
  components: Component[],
  autoImport = false
): ComponentUse[] {
  const variableLocators: Record<string, Component> = {}
  const localImports = getUsedImports(opts, ast, [
    { name: 'resolveComponent', from: 'vue' },
    { name: 'createVNode', from: 'vue' },
    { name: 'createBlock', from: 'vue' },
    { name: 'ssrRenderComponent', from: 'vue/server-renderer' },
    { name: 'h', from: 'vue' },
    { name: 'unref', from: 'vue' },
  ])
  const { resolveComponent, unref, ...renderFns } = localImports.reduce(
    (map, imp) => {
      map[imp.name] = imp.local
      return map
    },
    {} as Record<string, string>
  )

  // Find any calls to resolveComponent() where the component being resolved
  // is a string that matches one of the components we are looking for.

  opts.traverse(ast, {
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
            const identifier = (path.parentPath as NodePath<VariableDeclarator>)
              .node.id
            if (identifier.type === 'Identifier') {
              variableLocators[identifier.name] = component
            }
            if (autoImport) {
              const localName = addImport(opts, rootPath(path).node, component)
              path.replaceWith(t.expression.ast(localName))
            }
          }
        }
      }
    },
    ImportDeclaration(path) {
      components.forEach((component) => {
        if (path.node.source.value === component.from && path.node.specifiers) {
          path.traverse({
            ImportSpecifier(path) {
              const imported = path.get('imported')
              const local = path.get('local')
              if (
                imported.isStringLiteral({ value: component.name }) ||
                imported.isIdentifier({ name: component.name })
              ) {
                variableLocators[local.node.name] = component
              }
            },
          })
        }
      })
    },
  })

  // Find any calls to createVNode, createBlock, createSSRComponent where the
  // component being resolved
  const renderFnNames = Object.values(renderFns)
  const componentUses: ComponentUse[] = []
  opts.traverse(ast, {
    CallExpression(path) {
      if (
        path.node.callee.type === 'Identifier' &&
        renderFnNames.includes(path.node.callee.name)
      ) {
        let componentName: string | undefined = undefined

        if (
          path.node.arguments[0]?.type === 'Identifier' &&
          path.node.arguments[0]?.name in variableLocators
        ) {
          // If it is a resolveComponent call, we only to check the first argument.
          componentName = path.node.arguments[0].name
        } else if (
          // When a component is directly imported, it is referred to with `unref` for some reason.
          // so we need to locate that call and checks its first argument.
          path.node.arguments[0]?.type === 'CallExpression' &&
          path.node.arguments[0]?.callee.type === 'Identifier' &&
          path.node.arguments[0]?.callee.name === unref &&
          path.node.arguments[0]?.arguments[0]?.type === 'Identifier' &&
          path.node.arguments[0]?.arguments[0]?.name in variableLocators
        ) {
          componentName = path.node.arguments[0].arguments[0].name
        }

        if (componentName) {
          const component = variableLocators[componentName]
          componentUses.push({
            ...component,
            id: extractPath(id),
            path,
            root: ast,
            opts,
          })
        }
      }
    },
  })
  return componentUses
}

/**
 * Extracts the path from a given ID.
 * @param id - The ID of the file to extract the path from.
 * @returns
 */
function extractPath(id: string) {
  // Add a base URL to ensure the URL module can parse it correctly
  const baseUrl = 'file://'
  const u = new URL(baseUrl + id)
  // Extract and return the pathname
  return u.pathname
}
