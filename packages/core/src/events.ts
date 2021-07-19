import { FormKitContext, FormKitNode } from './node'
import { isNode } from './utils'

/**
 * Event listener functions definition.
 * @public
 */
export interface FormKitEventListener {
  (event: FormKitEvent): void
}

/**
 * The internal structure of a FormKitEvent
 * @public
 */
export interface FormKitEvent {
  payload: any
  name: string
  bubble: boolean
  origin: FormKitNode<any>
}

/**
 * The FormKitEventEmitter definition.
 * @public
 */
export interface FormKitEventEmitter {
  (node: FormKitNode<any>, event: FormKitEvent): void
  on: (eventName: string, listener: FormKitEventListener) => void
}

/**
 * Creates a new event emitter, each node uses one of these to allow it to emit
 * events to local listeners and tree listeners.
 * @returns FormKitEventEmitter
 */
export function createEmitter(): FormKitEventEmitter {
  const listeners = new Map<string, FormKitEventListener[]>()

  const emitter = (node: FormKitNode<any>, event: FormKitEvent) => {
    if (listeners.has(event.name)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      listeners.get(event.name)!.forEach((listener) => listener(event))
    }
    if (event.bubble) {
      node.bubble(event)
    }
  }
  emitter.on = (eventName: string, listener: FormKitEventListener) => {
    listeners.has(eventName)
      ? listeners.get(eventName)!.push(listener) // eslint-disable-line @typescript-eslint/no-non-null-assertion
      : listeners.set(eventName, [listener])
    return
  }
  return emitter
}

/**
 * Emit an event from this node.
 * @param node -
 * @param context -
 * @param name -
 * @param payload -
 * @returns FormKitNode
 */
export function emit<T>(
  node: FormKitNode<T>,
  context: FormKitContext<T>,
  name: string,
  payload?: any // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
): FormKitNode<T> {
  context._e(node, {
    payload,
    name,
    bubble: true,
    origin: node,
  })
  return node
}

/**
 * Send an event from the given node up it's ancestor tree.
 * @param node -
 * @param _context -
 * @param event -
 */
export function bubble<T>(
  node: FormKitNode<T>,
  _context: FormKitContext<T>,
  event: FormKitEvent
): FormKitNode<T> {
  if (isNode(node.parent)) {
    node.parent._e(node.parent, event)
  }
  return node
}

/**
 * Adds an event listener to the node for a specific event.
 * @param node -
 * @param context -
 * @param name -
 * @param listener -
 * @returns FormKitNode
 */
export function on<T>(
  node: FormKitNode<T>,
  context: FormKitContext<T>,
  name: string,
  listener: FormKitEventListener
): FormKitNode<T> {
  context._e.on(name, listener)
  return node
}
