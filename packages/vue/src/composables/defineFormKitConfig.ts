import { DefaultConfigOptions } from '../index'

export function defineFormKitConfig(
  config: DefaultConfigOptions = {}
): () => DefaultConfigOptions {
  return () => config
}
