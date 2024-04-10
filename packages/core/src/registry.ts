import type { FormKitNode } from './node'
import type { FormKitEventListener } from './events'
import { createEmitter } from './events'

/**
 * A global registry of nodes by their alias or name (if root).
 */
const registry: Map<string, FormKitNode> = new Map()
const reflected: Map<FormKitNode, string> = new Map()

/**
 * An event emitter for registered/set/unset nodes
 */
const emit = createEmitter()
/**
 * Receipts of listeners.
 */
const receipts: string[] = []

/**
 * Registers a node to the registry _if_ the node is a root node, _or_ if the
 * node has an explicit node.props.alias. If these two things are not true,
 * then no node is registered (idempotent).
 *
 * @param node - A {@link FormKitNode | FormKitNode}.
 *
 * @public
 */
export function register(node: FormKitNode): void {
  if (node.props.id) {
    registry.set(node.props.id, node)
    reflected.set(node, node.props.id)
    emit(node, {
      payload: node,
      name: node.props.id,
      bubble: false,
      origin: node,
    })
  }
}

/**
 * Deregister a node from the registry.
 *
 * @param node - A {@link FormKitNode | FormKitNode}.
 *
 * @public
 */
export function deregister(node: FormKitNode): void {
  if (reflected.has(node)) {
    const id = reflected.get(node)! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    reflected.delete(node)
    registry.delete(id)
    emit(node, {
      payload: null,
      name: id,
      bubble: false,
      origin: node,
    })
  }
}

/**
 * Get a node by a particular id.
 *
 * @param id - Get a node by a given id.
 *
 * @returns A {@link FormKitNode | FormKitNode} or `undefined`.
 *
 * @public
 */
export function getNode<T = unknown>(id: string): FormKitNode<T> | undefined {
  return registry.get(id) as FormKitNode<T> | undefined
}

/**
 * Resets the entire registry. Deregisters all nodes and removes all listeners.
 *
 * @public
 */
export function resetRegistry(): void {
  registry.forEach((node) => {
    deregister(node)
  })
  receipts.forEach((receipt) => emit.off(receipt))
}

/**
 * A way of watching changes in the global registry.
 *
 * @param id - A dot-syntax id where the node is located.
 * @param callback - A callback in the format of {@link FormKitEventListener | FormKitEventListener} to notify when the node is set or removed.
 *
 * @public
 */
export function watchRegistry(
  id: string,
  callback: FormKitEventListener
): string {
  // register a listener
  const receipt = emit.on(id, callback)
  receipts.push(receipt)
  return receipt
}

/**
 * Stop watching the registry for a given receipt.
 * @param receipt - a receipt to stop watching
 */
export function stopWatch(receipt: string): void {
  emit.off(receipt)
}
