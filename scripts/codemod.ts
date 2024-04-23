/* @ts-check */
import { parse, print } from 'recast'
import traverse from '@babel/traverse'
import t from '@babel/template'
import { isIdentifier, cloneDeepWithoutLoc } from '@babel/types'
import { resolve } from 'path'
import { readFile } from 'fs/promises'
import type { Node, Comment } from '@babel/types'
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
    const content = await readFile(
      resolve(process.cwd(), 'packages/i18n/src/locales', locale),
      'utf-8'
    )
    const parser = await import('recast/parsers/babel-ts')
    const ast = parse(content, { parser })
    const uiExtractions = new Map<string, Node>()
    const comments = new Map<Node, Comment[] | null | undefined>()

    traverse(ast, {
      VariableDeclarator(propertyPath) {
        if (isIdentifier(propertyPath.node.id, { name: 'ui' })) {
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
          propertyPath.parentPath
            .getPrevSibling()
            .insertBefore([...uiExtractions.values()])
        }
      },
    })
    traverse(ast, {
      ExportDeclaration(path) {
        if (comments.has(path.node)) {
          path.addComments('leading', comments.get(path.node) as Comment[])
        }
      },
    })

    console.log(generator(ast).code)
  })
})()
