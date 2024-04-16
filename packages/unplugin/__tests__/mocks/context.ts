import type {
  UnpluginBuildContext,
  UnpluginContext,
  UnpluginMessage,
} from 'unplugin'
import type { ResolvedOptions } from '../../src/types'

export const createContext = (
  opts: ResolvedOptions
): UnpluginBuildContext & UnpluginContext => {
  return {
    error: (_message: string | UnpluginMessage) => {
      // mocked only
    },
    warn: (_message: string | UnpluginMessage) => {
      // mocked only
    },
    addWatchFile: (_id: string) => {
      // mocked only
    },
    emitFile: (_emittedFile: any) => {
      // mocked only
    },
    getWatchFiles: (): string[] => [],
    parse: (input: string, _opts?: any) => opts.parse(input),
  }
}
