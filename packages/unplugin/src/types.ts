import type { NodePath } from '@babel/traverse'
import type traverse from '@babel/traverse'

export interface Component {
  name: string
  from: string
  injectProps?: (currentProps: any, addImport: (code: string) => void) => void
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

export type ComponentUse = ComponentLocators & { path: NodePath }

export type Traverse = typeof traverse
