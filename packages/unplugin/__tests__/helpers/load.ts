import { createLoad } from '../../src/hooks/load'
import { createOpts } from '../../src/utils/config'
import type { Options } from '../../src/types'
import { createContext } from '../mocks/context'
import { createResolver } from '../../src/hooks/resolveId'

/**
 * Mocks the load function of the plugin.
 * @param id - The id of the module to load.
 * @param options - The plugin options to use.
 * @returns
 */
export async function load(id: string, options: Partial<Options> = {}) {
  const opts = createOpts(options)
  const load = createLoad(opts)
  const context = createContext(opts)
  const resolver = createResolver(opts)
  const resolvedId = (await resolver.apply(context, [
    id,
    'index.ts',
    { isEntry: false },
  ])) as string
  const result = await load.apply(context, [resolvedId])
  if (!result || typeof result === 'string') return result
  return result.code
}
