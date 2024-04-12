import type { NodePath } from '@babel/traverse'
import type { CallExpression, Program, File } from '@babel/types'
import type traverse from '@babel/traverse'
import type generate from '@babel/generator'

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
  codeMod?: (component: ComponentUse) => void
}

export interface Options {
  configFile?: string
  defaultConfig?: boolean
  components: Component[]
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
  traverse: Traverse
}

export type Traverse = typeof traverse
export type Generate = typeof generate
