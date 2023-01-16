import { token } from '@formkit/utils'
import { FormKitContext, FormKitNode, isNode } from './node'

/**
 * Event listener functions definition.
 *
 * @public
 */
export interface FormKitEventListener {
  (event: FormKitEvent): void
  receipt?: string
}

/**
 * The internal structure of a FormKitEvent.
 *
 * @public
 */
export interface FormKitEvent {
  payload: any
  name: string
  bubble: boolean
  origin: FormKitNode
}

/**
 * Event listeners are wrapped in this object before being stored.
 *
 * @internal
 */
export interface FormKitEventListenerWrapper {
  event: string
  listener: FormKitEventListener
  modifiers: string[]
  receipt: string
}

/**
 * The FormKitEventEmitter definition.
 *
 * @public
 */
export interface FormKitEventEmitter {
  (node: FormKitNode, event: FormKitEvent): void
  on: (eventName: string, listener: FormKitEventListener) => string
  off: (receipt: string) => void
  pause: (node?: FormKitNode) => void
  play: (node?: FormKitNode) => void
}

/**
 * Creates a new event emitter, each node uses one of these to allow it to emit
 * events to local listeners and tree listeners.
 *
 * @returns FormKitEventEmitter
 *
 * @internal
 */
export function createEmitter(): FormKitEventEmitter {
  const listeners = new Map<string, FormKitEventListenerWrapper[]>()
  const receipts = new Map<string, string[]>()
  let buffer: undefined | Map<string, [FormKitNode, FormKitEvent]> = undefined

  const emitter = (node: FormKitNode, event: FormKitEvent) => {
    if (buffer) {
      buffer.set(event.name, [node, event])
      return
    }
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

  /**
   * Add an event listener
   *
   * @param eventName - The name of the event to listen to
   * @param listener - The callback
   *
   * @returns string
   *
   * @internal
   */
  emitter.on = (eventName: string, listener: FormKitEventListener) => {
    const [event, ...modifiers] = eventName.split('.')
    const receipt = listener.receipt || token()
    const wrapper: FormKitEventListenerWrapper = {
      modifiers,
      event,
      listener,
      receipt,
    }
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    listeners.has(event)
      ? listeners.get(event)!.push(wrapper)
      : listeners.set(event, [wrapper])
    receipts.has(receipt)
      ? receipts.get(receipt)!.push(event)
      : receipts.set(receipt, [event])
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
    return receipt
  }

  /**
   * Remove an event listener
   *
   * @param listenerOrReceipt - Either a receipt or the callback function.
   *
   * @internal
   */
  emitter.off = (receipt: string) => {
    if (receipts.has(receipt)) {
      receipts.get(receipt)?.forEach((event) => {
        const eventListeners = listeners.get(event)
        if (Array.isArray(eventListeners)) {
          listeners.set(
            event,
            eventListeners.filter((wrapper) => wrapper.receipt !== receipt)
          )
        }
      })
      receipts.delete(receipt)
    }
  }

  /**
   * Pause emitting values. Any events emitted while paused will not be emitted
   * but rather "stored" — and whichever events are emitted last will be output.
   * For example:
   * pause()
   * emit('foo', 1)
   * emit('foo', 2)
   * emit('bar', 3)
   * emit('bar', 4)
   * play()
   * // would result in
   * emit('foo', 2)
   * emit('bar', 4)
   * Optionally pauses all children as well.
   *
   * @param node - A node to pause all children on.
   *
   * @internal
   */
  emitter.pause = (node?: FormKitNode) => {
    if (!buffer) buffer = new Map()
    if (node) {
      node.walk((child) => child._e.pause())
    }
  }

  /**
   * Release the current event buffer.
   *
   * @param node - A node to unpause all children on.
   *
   * @internal
   */
  emitter.play = (node?: FormKitNode) => {
    if (!buffer) return
    const events = buffer
    buffer = undefined
    events.forEach(([node, event]) => emitter(node, event))
    if (node) {
      node.walk((child) => child._e.play())
    }
  }

  return emitter
}

/**
 * Emit an event from this node.
 *
 * @param node - The node that is emitting
 * @param context - The context of that node
 * @param name - The name of the event
 * @param payload - The payload to emit
 *
 * @returns FormKitNode
 *
 * @internal
 */
export function emit(
  node: FormKitNode,
  context: FormKitContext,
  name: string,
  payload?: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types,
  bubble = true
): FormKitNode {
  context._e(node, {
    payload,
    name,
    bubble,
    origin: node,
  })
  return node
}

/**
 * Send an event from the given node up it's ancestor tree.
 *
 * @param node -
 * @param _context -
 * @param event -
 *
 * @internal
 */
export function bubble(
  node: FormKitNode,
  _context: FormKitContext,
  event: FormKitEvent
): FormKitNode {
  if (isNode(node.parent)) {
    node.parent._e(node.parent, event)
  }
  return node
}

/**
 * Adds an event listener to the node for a specific event. The event name is a
 * simple string matching the name of the event to listen to. It can optionally
 * include modifiers like eventName.deep
 *
 * @param node -
 * @param context -
 * @param name -
 * @param listener -
 *
 * @returns FormKitNode
 *
 * @internal
 */
export function on(
  _node: FormKitNode,
  context: FormKitContext,
  name: string,
  listener: FormKitEventListener
): string {
  return context._e.on(name, listener)
}

/**
 * Removes an event listener from a node by the returned receipt from .on().
 *
 * @param node - The node to remote the listener from
 * @param context - The context to remove
 * @param receipt - The receipt returned by .on()
 *
 * @returns FormKitNode
 *
 * @internal
 */
export function off(
  node: FormKitNode,
  context: FormKitContext,
  receipt: string
): FormKitNode {
  context._e.off(receipt)
  return node
}
