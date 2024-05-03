import type { ResolvedOptions } from '../types'
import type { UnpluginOptions } from 'unplugin'
import { resolve, dirname } from 'pathe'
import { FORMKIT_CONFIG_PREFIX } from '../index'
import { resolveFile } from '../utils/config'

export function createResolver(
  opts: ResolvedOptions
): Exclude<UnpluginOptions['resolveId'], undefined> {
  return function resolveId(id, importer) {
    if (id.startsWith(FORMKIT_CONFIG_PREFIX)) {
      return '\0' + id
    }
    if (
      id.startsWith('./') &&
      opts.configPath &&
      importer?.startsWith(`\0${FORMKIT_CONFIG_PREFIX}`)
    ) {
      // This is an import from a formkit virtual module which is almost
      // for sure a extract from a formkit config file — so we should resolve
      // this current id to the actual file path.
      const path = resolveFile(resolve(dirname(opts.configPath), id))
      if (path) {
        return path
      }
    }
    return null
  }
}
