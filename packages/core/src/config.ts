import type { FormKitConfig, FormKitNode } from './node'

/**
 * Applies a given config change to the node.
 *
 * @param node - The node to check for config change
 * @param prop - Checks if this property exists in the local config or props
 * @param value - The value to set
 *
 * @internal
 */
export function configChange(
  node: FormKitNode,
  prop: string,
  value: unknown
): boolean {
  // When we return false, node.walk will not continue into that child.
  let usingFallback = true
  !(prop in node.config._t)
    ? node.emit(`config:${prop}`, value, false)
    : (usingFallback = false)

  if (!(prop in node.props)) {
    node.emit('prop', { prop, value })
    node.emit(`prop:${prop}`, value)
  }
  return usingFallback
}

/**
 * Global configuration options.
 *
 * @public
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
 * @param options - An object of optional properties of {@link FormKitConfig | FormKitConfig}.
 *
 * @returns A {@link FormKitRootConfig | FormKitRootConfig}.
 *
 * @public
 */
export function createConfig(
  options: Partial<FormKitConfig> = {}
): FormKitRootConfig {
  const nodes = new Set<FormKitNode>()
  const target = {
    ...options,
    ...{
      _add: (node: FormKitNode) => nodes.add(node),
      _rm: (node: FormKitNode) => nodes.delete(node),
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
