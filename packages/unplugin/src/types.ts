import type { NodePath } from '@babel/traverse'
import type { CallExpression, Program, File, Node } from '@babel/types'
import type traverse from '@babel/traverse'
import type generate from '@babel/generator'
import type { PrintResultType } from 'recast/lib/printer'
import type { DefineConfigOptions } from '@formkit/vue'

export interface Import {
  name: string
  from: string
}

export interface LocalizedImport {
  name: string
  from: string
  local: string
}

export interface Component extends Import {
  codeMod?: (component: ComponentUse) => void | Promise<void>
}

export interface Options {
  configFile?: string
  components: Component[]
}

export interface ResolvedOptions extends Options, ASTTools {
  configAst: File | Program | undefined
  configCode: string
  configParseCount: number
  optimize: Readonly<{
    [K in keyof Required<
      Exclude<DefineConfigOptions['optimize'], boolean>
    >]: boolean
  }>
  builtins: Readonly<{
    [K in keyof Required<
      Exclude<DefineConfigOptions['optimize'], boolean>
    >]: boolean
  }>
  projectRoot?: string
  configPath?: string
  configLocalize?: string[]
  configIconLoaderUrl?: DefineConfigOptions['iconLoaderUrl']
  configIconLoader?: DefineConfigOptions['iconLoader']
  configMemo: object
}

export interface ASTTools {
  traverse: Traverse
  generate: (ast: Node) => PrintResultType
  parse: (code: string) => File
}

export type ComponentLocators =
  | {
      component: Component
      retrievedBy: 'variable'
      variableName: string
    }
  | {
      component: Component
      retrievedBy: 'setup'
    }

export type ComponentUse = Component & {
  id: string
  path: NodePath<CallExpression>
  root: File | Program
  opts: ResolvedOptions
}

export type UsedFeatures = {
  localizations: Set<string>
  inputs: Set<string>
  rules: Set<string>
  icons: Map<string, Set<string>>
  families: Set<string>
  classes: Set<string>
}

export type Traverse = typeof traverse
export type Generate = typeof generate
