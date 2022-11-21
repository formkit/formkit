import { has } from '@formkit/utils'
import type {
  FormKitNode,
  FormKitEventListener,
  FormKitProps,
  FormKitLedger} from '@formkit/core';
import { isNode } from '@formkit/core'

/**
 * An API compatible FormKitNode that is able to determine the full dependency
 * tree of nodes and their values.
 * @public
 */
export interface FormKitObservedNode extends FormKitNode {
  deps: FormKitDependencies
  kill: () => void
  observe: () => void
  receipts: FormKitObserverReceipts
  stopObserve: () => FormKitDependencies
  watch: (block: FormKitWatchable) => void
}

/**
 * The dependent nodes and the events that are required to watch for changes.
 * @internal
 */
export type FormKitDependencies = Map<FormKitNode, Set<string>> & {
  active?: boolean
}

/**
 * A Map of nodes with the values being Maps of eventsName: receipt
 * @internal
 */
type FormKitObserverReceipts = Map<FormKitNode, { [index: string]: string }>

/**
 * A callback to watch for nodes.
 * @public
 */
export interface FormKitWatchable {
  (node: FormKitObservedNode): any
}

/**
 * A registry of all revoked observers.
 */
const revokedObservers = new WeakSet()

/**
 * The FormKitNode to observe.
 * @param node - Any formkit node to observe.
 * @returns
 * @public
 */
export function createObserver(
  node: FormKitNode,
  dependencies?: FormKitDependencies
): FormKitObservedNode {
  // The dependencies touched during tracking
  const deps: FormKitDependencies =
    dependencies || Object.assign(new Map(), { active: false })
  // A registry of event receipts returned by the event system
  const receipts: FormKitObserverReceipts = new Map()

  /**
   * Simple function to add a dependency to the deps map.
   * @param event - The name of the event type (like commit/input etc)
   */
  const addDependency = function (event: string) {
    if (!deps.active) return
    if (!deps.has(node)) deps.set(node, new Set())
    deps.get(node)?.add(event)
  }

  /**
   * Proxies the props of a node so we know which ones were messed with, could
   * potentially be more generalized in the future if we want to support
   * more sub-objects.
   * @param props - The props object from a node
   * @returns
   */
  const observeProps = function (props: FormKitProps) {
    return new Proxy(props, {
      get(...args) {
        typeof args[1] === 'string' && addDependency(`prop:${args[1]}`)
        return Reflect.get(...args)
      },
    })
  }

  /**
   * Observes the FormKit ledger "value".
   * @param ledger - A formkit ledger counter.
   */
  const observeLedger = function (ledger: FormKitLedger) {
    return new Proxy(ledger, {
      get(...args) {
        if (args[1] === 'value') {
          return (key: string) => {
            addDependency(`count:${key}`)
            return ledger.value(key)
          }
        }
        return Reflect.get(...args)
      },
    })
  }

  /**
   * Return values from our observer proxy first pass through this function
   * which gives us a chance to listen sub-dependencies and properties.
   */
  const observe = function (value: any, property: string | symbol) {
    if (isNode(value)) {
      return createObserver(value, deps)
    }
    if (property === 'value') addDependency('commit')
    if (property === 'props') return observeProps(value)
    if (property === 'ledger') return observeLedger(value)
    return value
  }

  /**
   * The actual proxy object of the original node.
   */
  const {
    proxy: observed,
    revoke,
  }: { proxy: FormKitNode; revoke: () => void } = Proxy.revocable(node, {
    get(...args) {
      switch (args[1]) {
        case 'deps':
          return deps
        case 'watch':
          return (block: FormKitWatchable) =>
            watch(observed as FormKitObservedNode, block)
        case 'observe':
          return () => {
            const old = new Map(deps)
            deps.clear()
            deps.active = true
            return old
          }
        case 'stopObserve':
          return () => {
            const newDeps = new Map(deps)
            deps.active = false
            return newDeps
          }
        case 'receipts':
          return receipts
        case 'kill':
          return () => {
            removeListeners(receipts)
            revokedObservers.add(args[2])
            revoke()
          }
      }
      const value = Reflect.get(...args)
      // If we're dealing with a function, we need to sub-call the function
      // get that return value, and pass it through the same logic.
      if (typeof value === 'function') {
        return (...subArgs: any[]) => {
          const subValue = value(...subArgs)
          return observe(subValue, args[1])
        }
      }
      return observe(value, args[1])
    },
  })
  return observed as unknown as FormKitObservedNode
}

/**
 * Given two maps (toAdd and toRemove) apply the dependencies as event listeners
 * on the underlying nodes.
 * @param node - The node to apply dependencies to
 * @param delta - The toAdd and toRemove dependency Maps
 * @public
 */
export function applyListeners(
  node: FormKitObservedNode,
  [toAdd, toRemove]: [FormKitDependencies, FormKitDependencies],
  callback: FormKitEventListener
): void {
  toAdd.forEach((events, depNode) => {
    events.forEach((event) => {
      node.receipts.has(depNode) || node.receipts.set(depNode, {})
      node.receipts.set(
        depNode,
        Object.assign(node.receipts.get(depNode), {
          [event]: depNode.on(event, callback),
        })
      )
    })
  })
  toRemove.forEach((events, depNode) => {
    events.forEach((event) => {
      if (node.receipts.has(depNode)) {
        const nodeReceipts = node.receipts.get(depNode)
        if (nodeReceipts && has(nodeReceipts, event)) {
          depNode.off(nodeReceipts[event])
          delete nodeReceipts[event]
          node.receipts.set(depNode, nodeReceipts)
        }
      }
    })
  })
}

/**
 * Remove all the receipts from the observed node and subtree.
 * @param receipts - The formkit observer receipts to remove
 * @public
 */
export function removeListeners(receipts: FormKitObserverReceipts): void {
  receipts.forEach((events, node) => {
    for (const event in events) {
      node.off(events[event])
    }
  })
}

/**
 * Observes a chunk of code to dependencies, and then re-calls that chunk of
 * code when those dependencies are manipulated.
 * @param node - The node to observer
 * @param block - The block of code to observe
 * @public
 */
async function watch(
  node: FormKitObservedNode,
  block: FormKitWatchable
): Promise<void> {
  const oldDeps = new Map(node.deps)
  node.observe()
  const res = block(node)
  if (res instanceof Promise) await res
  const newDeps = node.stopObserve()
  applyListeners(node, diffDeps(oldDeps, newDeps), () => watch(node, block))
}

/**
 * Determines which nodes should be added as dependencies and which should be
 * removed.
 * @param previous - The previous watcher dependencies
 * @param current - The new/current watcher dependencies
 * @returns
 * @public
 */
export function diffDeps(
  previous: FormKitDependencies,
  current: FormKitDependencies
): [FormKitDependencies, FormKitDependencies] {
  const toAdd: FormKitDependencies = new Map()
  const toRemove: FormKitDependencies = new Map()
  current.forEach((events, node) => {
    if (!previous.has(node)) {
      toAdd.set(node, events)
    } else {
      const eventsToAdd = new Set<string>()
      const previousEvents = previous.get(node)
      events.forEach(
        (event) => !previousEvents?.has(event) && eventsToAdd.add(event)
      )
      toAdd.set(node, eventsToAdd)
    }
  })
  previous.forEach((events, node) => {
    if (!current.has(node)) {
      toRemove.set(node, events)
    } else {
      const eventsToRemove = new Set<string>()
      const newEvents = current.get(node)
      events.forEach(
        (event) => !newEvents?.has(event) && eventsToRemove.add(event)
      )
      toRemove.set(node, eventsToRemove)
    }
  })
  return [toAdd, toRemove]
}

/**
 * Checks if the given noe is revoked.
 * @param node - Any observed node to check.
 * @returns
 * @public
 */
export function isKilled(node: FormKitObservedNode): boolean {
  return revokedObservers.has(node)
}
