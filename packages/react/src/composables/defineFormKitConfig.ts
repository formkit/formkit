import { DefaultConfigOptions } from '../index'

export function defineFormKitConfig(
  config: DefaultConfigOptions | (() => DefaultConfigOptions)
): () => DefaultConfigOptions {
  return () => (typeof config === 'function' ? config() : config)
}
