import type traverse from '@babel/traverse'

interface Component {
  name: string
  from: string
  injectProps?: (currentProps: any, addImport: (code: string) => void) => void
}

export interface Options {
  configFile?: string
  defaultConfig?: boolean
  components?: Component[]
}

export type Traverse = typeof traverse
