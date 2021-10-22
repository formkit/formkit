import { FormKitNode } from './node'

/**
 * A global registry of nodes by their alias or name (if root).
 */
const registry: Map<string, FormKitNode<unknown>> = new Map()
const reflected: Map<FormKitNode<unknown>, string> = new Map()

/**
 * Registers a node to the registry _if_ the node is a root node, _or_ if the
 * node has an explicit node.props.alias. If these two things are not true
 * then no node is registered (idempotent).
 *
 * @param node - A node to register
 */
export function register(node: FormKitNode<any>): void {
  if (!node.parent || node.props.alias) {
    const key = node.props.alias || node.name
    registry.set(key, node)
    reflected.set(node, key)
  }
}

/**
 * Deregister a node from the registry.
 * @param node - A node to remove
 */
export function deregister(node: FormKitNode<any>): void {
  if (reflected.has(node)) {
    const key = reflected.get(node)! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    reflected.delete(node)
    registry.delete(key)
  }
}

/**
 * Get a node by a particular key
 * @param node - Get a node by a given key
 */
export function get(key: string): FormKitNode<unknown> | false {
  return registry.get(key) || false
}

/**
 * Reset the entire registry.
 */
export function resetRegistry(): void {
  registry.forEach((node) => deregister(node))
}
