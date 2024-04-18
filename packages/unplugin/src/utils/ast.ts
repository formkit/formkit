import type {
  Node,
  File,
  Expression,
  StringLiteral,
  ObjectProperty,
  Program,
  ImportDeclaration,
  Declaration,
} from '@babel/types'
import { cloneDeepWithoutLoc } from '@babel/types'
import type { Binding, NodePath } from '@babel/traverse'
import t from '@babel/template'
import type { Import, LocalizedImport, ASTTools } from '../types'

/**
 * Create an object property with the given key and value.
 * @param key - The key of the property
 * @param value - The value of the property
 */
export function createProperty(
  key: string,
  value: Expression | StringLiteral
): ObjectProperty {
  return {
    type: 'ObjectProperty',
    computed: false,
    shorthand: false,
    key: {
      type: 'Identifier',
      name: key,
    },
    value,
  }
}

/**
 * Add an import to the top of the file if it is not already being used. Note
 * that this function will always ensure the imported name is unique to the
 * file, meaning you should perform this import *before* using the import name
 * in the file otherwise it will produce a new unique name.
 * @param traverse - The babel/traverse object
 * @param ast - The AST to traverse
 * @param imp - The import to add
 * @returns
 */
export function addImport(
  opts: ASTTools,
  ast: File | Program,
  imp: Import
): string {
  // Check if this import is already being used.
  const imports = getUsedImports(opts, ast, [imp])
  if (imports.length) {
    return imports[0].local
  }
  const local = uniqueVariableName(opts, ast, imp.name)
  const importStatement = t.statement
    .ast`import { ${imp.name} as ${local} } from '${imp.from}'`
  if (ast.type === 'Program') {
    ast.body.unshift(importStatement)
  } else {
    let inserted = false
    opts.traverse(ast, {
      Program(path) {
        inserted = true
        path.node.body.unshift(importStatement)
        path.stop()
      },
    })
    if (!inserted) {
      throw new Error(
        `Could not insert import { ${imp.name} as ${local} } from '${imp.from}' — no Program node found.`
      )
    }
  }
  return local
}

/**
 * Check for the unique name of a variable within the entire scope of the
 * module. If not available, increment the name and try again.
 * @param traverse - The babel/traverse object
 * @param ast - The AST to traverse
 * @param baseName - The base name to use for the variable
 * @returns
 */
export function uniqueVariableName(
  opts: ASTTools,
  ast: Node,
  baseName: string
): string {
  let localName = baseName
  let i = 0
  let found = false
  do {
    found = false
    opts.traverse(ast, {
      Identifier(path) {
        if (path.node.name === localName) {
          found = true
          path.stop()
        }
      },
    })
    if (found) {
      i++
      localName = `${baseName}${i ? i : ''}`
    }
  } while (found)
  return localName
}

/**
 * Locates the local names for the imported functions.
 */
export function getUsedImports(
  opts: ASTTools,
  ast: Node,
  imports: Import[]
): LocalizedImport[] {
  const localizedImports: LocalizedImport[] = []
  const remappedImports = imports.reduce((map, imp) => {
    map[imp.from] ??= []
    map[imp.from].push(imp.name)
    return map
  }, {} as Record<string, string[]>)
  opts.traverse(ast, {
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
 * Recursively walk up the path to find the root path.
 * @param path - The path to find the root of
 * @returns
 */
export function rootPath(path: NodePath<any>): NodePath<File> {
  if (path.parentPath) {
    return rootPath(path.parentPath)
  }
  return path
}

export function importOnly(ids: string[] | undefined, node: ImportDeclaration) {
  if (!ids) return
  node.specifiers = node.specifiers.filter((specifier) => {
    return (
      (specifier.type === 'ImportSpecifier' &&
        ids.includes(specifier.local.name)) ||
      (specifier.type === 'ImportDefaultSpecifier' &&
        ids.includes(specifier.local.name))
    )
  })
}

/**
 * Adds a declaration to the dependencies set.
 * @param dependencies - Dependencies we have already found
 * @param usedImports - A map of imports that are actually used
 * @param binding - The binding of the identifier
 * @param id - The identifier name
 */
function addDeclaration(
  dependencies: Set<NodePath<Declaration>>,
  usedImports: Map<NodePath<ImportDeclaration>, string[]>,
  binding: Binding | undefined,
  id: string
) {
  if (!binding) throw new Error('Could not find binding')
  const declaration = binding.path.isDeclaration()
    ? binding.path
    : (binding.path.findParent((p) =>
        p.isDeclaration()
      ) as NodePath<Declaration>)
  const parent = declaration.getFunctionParent() as NodePath<Declaration>
  if (declaration) {
    if (!dependencies.has(declaration) && !dependencies.has(parent)) {
      dependencies.add(declaration)
      extractDependencyPaths(declaration, dependencies, usedImports)
    }
    if (declaration.isImportDeclaration()) {
      usedImports.set(
        declaration,
        (usedImports.get(declaration) ?? []).concat([id])
      )
    }
  }
}

/**
 * Recursively extract all dependencies of a given path. This is similar to
 * tree shaking but for a single ast path.
 * @param toExtract - The path to extract
 * @param dependencies - A Map of identifiers with dependencies
 * @returns
 */
function extractDependencyPaths(
  toExtract: NodePath<Node>,
  dependencies: Set<NodePath<Declaration>> = new Set(),
  usedImports: Map<NodePath<ImportDeclaration>, string[]> = new Map()
): [Set<NodePath<Declaration>>, Map<NodePath<ImportDeclaration>, string[]>] {
  if (
    toExtract.isIdentifier() &&
    toExtract.scope.hasBinding(toExtract.node.name)
  ) {
    addDeclaration(
      dependencies,
      usedImports,
      toExtract.scope.getBinding(toExtract.node.name),
      toExtract.node.name
    )
  } else {
    toExtract.traverse({
      ReferencedIdentifier(path) {
        addDeclaration(
          dependencies,
          usedImports,
          path.scope.getBinding(path.node.name),
          path.node.name
        )
      },
    })
  }
  return [dependencies, usedImports]
}

/**
 * Given a source file (in ast format) and given a node inside that file,
 * extract the node from the file and any of its dependencies into a new AST
 * file.
 * @param opts - Ast tools
 * @param node - The node to extract
 * @param ast - The AST to extract from
 * @returns
 */
export function extract(
  toExtract: NodePath<Node>,
  exportName = 'extracted'
): Program {
  const [dependencies, usedImports] = extractDependencyPaths(toExtract)
  const extracted: [pos: number | undefined, Node][] = []
  dependencies.forEach((path) => {
    const node = cloneDeepWithoutLoc(path.node)
    if (path.isImportDeclaration()) {
      importOnly(usedImports.get(path), node as ImportDeclaration)
    }
    extracted.push([path.node.loc?.start.index, node])
  })
  extracted.sort(([a], [b]) => (a ?? 0) - (b ?? 0))
  const program = t.program.ast`${extracted.map(([, node]) => node)}
    export const ${exportName} = ${cloneDeepWithoutLoc(toExtract.node)}`
  return program
}
