/* @ts-check */
import { parse } from 'recast'
import traverse from '@babel/traverse'
import t from '@babel/template'
import { isIdentifier, cloneDeepWithoutLoc } from '@babel/types'
import { resolve } from 'path'
import { readFile, writeFile } from 'fs/promises'
import type {
  Node,
  Comment,
  FunctionDeclaration,
  ExportDeclaration,
  ExportNamedDeclaration,
  FunctionExpression,
} from '@babel/types'
import generator from '@babel/generator'

async function getAllLocales() {
  // const locales = await readdir(
  //   resolve(process.cwd(), 'packages/i18n/src/locales')
  // )
  // return locales
  return ['en.ts']
}
;(async () => {
  const locales = await getAllLocales()
  locales.map(async (locale) => {
    const path = resolve(process.cwd(), 'packages/i18n/src/locales', locale)
    const content = await readFile(path, 'utf-8')
    const parser = await import('recast/parsers/babel-ts')
    const ast = parse(content, { parser })
    const uiExtractions = new Map<string, Node>()
    const comments = new Map<Node, Comment[] | null | undefined>()

    traverse(ast, {
      VariableDeclarator(propertyPath) {
        if (isIdentifier(propertyPath.node.id, { name: 'ui' })) {
          comments.set(propertyPath.node, propertyPath.node.leadingComments)
          propertyPath.get('init').traverse({
            ObjectProperty(path) {
              const key = path.get('key')
              if (key.isIdentifier() && !uiExtractions.has(key.node.name)) {
                const varExport = t.statement.ast`export const ${
                  key.node.name
                } = ${cloneDeepWithoutLoc(path.get('value').node)}`
                uiExtractions.set(key.node.name, varExport)
                comments.set(varExport, path.node.leadingComments)
                path.insertAfter({
                  type: 'ObjectProperty',
                  key: key.node,
                  value: t.expression.ast`${key.node.name}`,
                  computed: false,
                  shorthand: true,
                })
                path.remove()
              }
              path.skip()
            },
            ObjectMethod() {
              throw new Error('Unexpected method in ui object')
            },
          })
        }
      },
    })

    const validationExtractions = new Map<
      string,
      ExportDeclaration | FunctionDeclaration
    >()

    // Now lets update all the validation messages.
    traverse(ast, {
      VariableDeclarator(validationsPath) {
        if (isIdentifier(validationsPath.node.id, { name: 'validation' })) {
          validationsPath.get('init').traverse({
            ObjectProperty(path) {
              path.skip()
              const key = path.get('key')
              if (
                key.isIdentifier() &&
                !validationExtractions.has(key.node.name)
              ) {
                const varExport = t.statement.ast`export const ${
                  key.node.name
                } = ${cloneDeepWithoutLoc(
                  path.get('value').node
                )}` as ExportDeclaration
                comments.set(varExport, path.node.leadingComments)
                validationExtractions.set(key.node.name, varExport)
                path.insertAfter({
                  type: 'ObjectProperty',
                  key: key.node,
                  value: t.expression.ast`${key.node.name}`,
                  computed: false,
                  shorthand: true,
                })
                path.remove()
              }
            },
            ObjectMethod(path) {
              path.skip()
              const key = path.get('key')
              if (
                key.isIdentifier() &&
                !validationExtractions.has(key.node.name)
              ) {
                const func: FunctionExpression = {
                  type: 'FunctionExpression',
                  params: path.node.params,
                  body: path.node.body,
                  generator: false,
                  async: false,
                }
                const funcExport = t.statement
                  .ast`export const ${key.node.name} = ${func}` as ExportNamedDeclaration
                /* @ts-expect-error */
                funcExport.declaration.declarations[0].id.typeAnnotation = {
                  type: 'TypeAnnotation',
                  typeAnnotation: {
                    type: 'GenericTypeAnnotation',
                    typeParameters: null,
                    id: {
                      type: 'Identifier',
                      name: 'FormKitValidationMessage',
                    },
                  },
                }
                comments.set(funcExport, path.node.leadingComments)
                validationExtractions.set(key.node.name, funcExport)
                path.insertAfter({
                  type: 'ObjectProperty',
                  key: key.node,
                  value: t.expression.ast`${key.node.name}`,
                  computed: false,
                  shorthand: true,
                })
                path.remove()
              }
            },
          })
        }
      },
    })

    traverse(ast, {
      ImportDeclaration(path) {
        if (
          path.get('source').node.value === '@formkit/validation' &&
          path.node.importKind === 'type'
        ) {
          path.node.specifiers.push({
            type: 'ImportSpecifier',
            imported: { type: 'Identifier', name: 'FormKitValidationMessage' },
            local: { type: 'Identifier', name: 'FormKitValidationMessage' },
          })
        }

        if (path.get('source').node.value === '../i18n') {
          path.node.trailingComments = []
          path.insertAfter([
            ...uiExtractions.values(),
            ...validationExtractions.values(),
          ])
        }
      },
      ExportDeclaration(path) {
        if (comments.has(path.node)) {
          path.addComments('leading', comments.get(path.node) as Comment[])
        }
      },
    })

    await writeFile(
      resolve(process.cwd(), 'packages/i18n/src/locales', `${locale}`),
      generator(ast).code
    )
  })
})()
