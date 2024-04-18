import cjsTraverse from '@babel/traverse'
import type { NodePath } from '@babel/traverse'
import * as parser from '@babel/parser'
import { extend } from '@formkit/utils'
import { configureFormKitInstance } from './formkit'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'pathe'
import { parse as recastParser, print } from 'recast'
import type { File, Node, ObjectProperty } from '@babel/types'
import type { Options, ResolvedOptions, Traverse, ASTTools } from '../types'
import { consola } from 'consola'

// The babel/traverse package imports an an object for some reason
// so we need to get the default property and preserve the types.
const traverse: Traverse =
  typeof cjsTraverse === 'function' ? cjsTraverse : (cjsTraverse as any).default

const ABSOLUTE_PATH_RE = /^(?:\/|[a-zA-Z]:\\)/

function createASTTools(): ASTTools {
  const parse = (code: string) => recastParser(code, { parser })
  const generate = (ast: Node) => print(ast, { parser })
  return { parse, generate, traverse }
}

/**
 * Resolves the configuration options for the plugin.
 * @param options - Options for the formkit build plugin.
 * @returns
 */
export function createOpts(options: Partial<Options>): ResolvedOptions {
  const { parse, generate, traverse } = createASTTools()
  const opts = extend(
    {
      components: [
        {
          name: 'FormKit',
          from: '@formkit/vue',
          codeMod: configureFormKitInstance,
        },
      ],
    },
    options ?? {},
    true
  ) as Options

  const configPath = resolveConfig(opts)
  let configAst: File | undefined
  if (configPath && existsSync(configPath)) {
    const configSource = readFileSync(configPath, { encoding: 'utf8' })
    configAst = parse(configSource)
  }
  return { ...opts, configAst, traverse, parse, generate }
}

/**
 * Resolve the absolute path to the configuration file.
 * @param configFile - The configuration file to attempt to resolve.
 */
function resolveConfig(opts: Options): string | undefined | void {
  const configFile = opts.configFile ?? 'formkit.config'
  const exts = ['ts', 'mjs', 'js']
  const dir = configFile.startsWith('.') ? process.cwd() : ''
  let paths: string[] = []

  if (exts.some((ext) => configFile.endsWith(ext))) {
    // If the config file has an extension, we don't need to try them all.
    paths = [
      ABSOLUTE_PATH_RE.test(configFile)
        ? resolve(configFile)
        : resolve(dir, configFile),
    ]
  } else {
    // If the config file doesn’t have an extension, try them all.
    paths = exts.map((ext) => resolve(dir, `${configFile}.${ext}`))
  }
  const path = paths.find((path) => existsSync(path))
  if (opts.configFile && !path) {
    throw new Error(`Could not find config file: ${opts.configFile}`)
  }
  return path
}

/**
 * Given the resolved configuration source ast, return the ast node that
 * represents the property with the given name.
 * @param opts - Resolved options
 * @param name - The name of the property to get from the config source.
 * @returns
 */
export function getConfigProperty(
  opts: ResolvedOptions,
  name: string
): NodePath<ObjectProperty> | undefined {
  let prop: NodePath<ObjectProperty> | undefined
  if (!opts.configAst) return undefined
  opts.traverse(opts.configAst, {
    CallExpression(path) {
      if (
        path.node.callee.type === 'Identifier' &&
        path.node.callee.name === 'defineFormKitConfig'
      ) {
        const [config] = path.node.arguments
        if (config.type === 'ObjectExpression') {
          path.traverse({
            ObjectProperty(propertyPath) {
              if (
                propertyPath.parentPath.parentPath === path &&
                propertyPath.node.key.type === 'Identifier' &&
                propertyPath.node.key.name === name
              ) {
                prop = propertyPath
                path.stop()
              }
            },
          })
          path.stop()
        } else {
          consola.warn(
            '[FormKit de-opt] call defineFormKitConfig with an object literal to enable optimizations.'
          )
        }
      }
    },
  })

  return prop
}
