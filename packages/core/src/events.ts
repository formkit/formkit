import { FormKitContext, FormKitNode, isNode } from './node'

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
 * Event listeners are wrapped in this object before being stored.
 * @internal
 */
export interface FormKitEventListenerWrapper {
  event: string
  listener: FormKitEventListener
  modifiers: string[]
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
  const listeners = new Map<string, FormKitEventListenerWrapper[]>()

  const emitter = (node: FormKitNode<any>, event: FormKitEvent) => {
    if (listeners.has(event.name)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      listeners.get(event.name)!.forEach((wrapper) => {
        if (event.origin === node || wrapper.modifiers.includes('deep')) {
          wrapper.listener(event)
        }
      })
    }
    if (event.bubble) {
      node.bubble(event)
    }
  }
  emitter.on = (eventName: string, listener: FormKitEventListener) => {
    const [event, ...modifiers] = eventName.split('.')
    const wrapper: FormKitEventListenerWrapper = {
      modifiers,
      event,
      listener,
    }
    listeners.has(event)
      ? listeners.get(event)!.push(wrapper) // eslint-disable-line @typescript-eslint/no-non-null-assertion
      : listeners.set(event, [wrapper])
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
 * Adds an event listener to the node for a specific event. The event name is a
 * simple string matching the name of the event to listen to. It can optionally
 * include modifiers like eventName.deep
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
