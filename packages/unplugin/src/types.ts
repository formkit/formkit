import type { NodePath } from '@babel/traverse'
import type { CallExpression, Program, File, Node } from '@babel/types'
import type traverse from '@babel/traverse'
import type generate from '@babel/generator'
import type { PrintResultType } from 'recast/lib/printer'

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
  defaultConfig?: boolean
  components: Component[]
}

export interface ResolvedOptions extends Options, ASTTools {
  configAst: File | Program | undefined
  configParseCount: number
  configPath?: string
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
  path: NodePath<CallExpression>
  root: File | Program
  opts: ResolvedOptions
}

export type Traverse = typeof traverse
export type Generate = typeof generate
