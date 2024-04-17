import type { ResolvedOptions } from '../types'
import type { UnpluginOptions } from 'unplugin'
import { FORMKIT_CONFIG_PREFIX } from '../index'

export function createResolver(
  _opts: ResolvedOptions
): Exclude<UnpluginOptions['resolveId'], undefined> {
  return function resolveId(id) {
    if (id.startsWith(FORMKIT_CONFIG_PREFIX)) {
      return '\0' + id
    }
    return null
  }
}
