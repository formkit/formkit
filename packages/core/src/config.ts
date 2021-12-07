import { FormKitConfig, FormKitNode, configChange } from './node'

/**
 * Global configuration options.
 */
export type FormKitRootConfig = Partial<FormKitConfig> & {
  _add: (node: FormKitNode) => void
  _rm: (node: FormKitNode) => void
}

/**
 * Creates a new instance of a global configuration option. This object is
 * essentially just a FormKitOption object, but it can be used as the root for
 * FormKitConfig's proxy and retain event "emitting".
 *
 * @param options - FormKit node options to be used globally.
 */
export function createConfig(
  options: Partial<FormKitConfig> = {}
): FormKitRootConfig {
  const nodes = new Set<FormKitNode>()
  const target = {
    ...options,
    ...{
      _add: (node: FormKitNode) => nodes.add(node),
      _rm: (node: FormKitNode) => node.remove(node),
    },
  }
  const rootConfig = new Proxy(target, {
    set(t, prop, value, r) {
      if (typeof prop === 'string') {
        nodes.forEach((node) => configChange(node, prop, value))
      }
      return Reflect.set(t, prop, value, r)
    },
  })
  return rootConfig
}
