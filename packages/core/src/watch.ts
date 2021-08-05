import { token, has } from '@formkit/utils'
import { FormKitNode } from './index'
import { isNode } from './node'

/**
 * A function that is called during the watch process. Any node dependencies
 * touched during this call are considered dependents.
 * @public
 */
export interface FormKitWatchable {
  (node: FormKitNode<unknown>): void | Promise<void>
}

/**
 * A FormKitNode watcher that is used to track dependent nodes of a given
 * block of functionality.
 * @internal
 */
interface FormKitNodeWatcher {
  start: () => Set<FormKitNode<any>>
  end: () => Set<FormKitNode<any>>
  node: FormKitNode<any>
}

/**
 * A global registry of all watchers.
 */
const watchers: { [index: string]: FormKitNodeWatcher } = {}

/**
 * Allows authors or developer to watch a callback for any other node
 * dependencies, and then re-run the callback if certain events are triggered
 * on those dependency nodes.
 *
 * NOTE: This watch function is not yet optimized, it does a _very_ basic job
 * off determining which nodes were selected, and re-running those code blocks
 * but it is not yet a good general-purpose algorithm.
 *
 * TODO: We need to convert this watcher to a more generalized solution that
 * knows automatically which events to bind to. For example accessing a
 * node.value should produce a 'commit' listener, while a node.props.x should
 * produce a 'prop' listener.
 * @param node - The node to create the watcher proxy for.
 * @param block - The block of code to watch for dependencies in
 * @param events - Bind these listeners to all dependencies to re-run the block
 */
export function watch(
  node: FormKitNode<any>,
  block: FormKitWatchable,
  events: string[]
): string {
  const receipt = token()
  const nodeWatcher = createWatcher(node)
  watchers[receipt] = nodeWatcher
  exec(block, nodeWatcher, events, receipt)
  return receipt
}

/**
 * Stop all watching for a given watcher.
 * @param receipt - The string returned by the watch() function
 */
export function killWatch(receipt: string): void {
  if (has(watchers, receipt)) {
    watchers[receipt].end().forEach((node) => node.off(receipt))
  }
}

/**
 * The function that actually calls a given watcher recursively
 * @param callback - The block of callback code to execute
 * @param watcher - The watcher object that performs the dependency listening
 * @param events - The events to listen to on all dependencies
 * @param receipt - A unique signature of this watcher
 */
async function exec(
  callback: FormKitWatchable,
  watcher: FormKitNodeWatcher,
  events: string[],
  receipt: string
) {
  const prevDeps = watcher.start()
  const res = callback(watcher.node)
  if (res instanceof Promise) {
    await res
  }
  const currentDeps = watcher.end()
  const [newDeps, removedDeps] = diffDeps(prevDeps, currentDeps)
  const listener = () => exec(callback, watcher, events, receipt)
  listener.receipt = receipt

  // Add listeners (using the receipt as the receipt)
  newDeps.forEach((n) => {
    events.forEach((event) => n.on(event, listener))
  })
  // Remove listeners (receipts remove all matching events)
  removedDeps.forEach((n) => n.off(receipt))
}

/**
 * Determines which nodes should be added as dependencies and which should be
 * removed.
 * @param previous - The previous watcher dependencies
 * @param current - The new/current watcher dependencies
 * @returns
 */
function diffDeps(
  previous: Set<FormKitNode<any>>,
  current: Set<FormKitNode<any>>
): [FormKitNode<any>[], FormKitNode<any>[]] {
  const toAdd: FormKitNode<any>[] = []
  const toRemove: FormKitNode<any>[] = []
  current.forEach((node) => !previous.has(node) && toAdd.push(node))
  previous.forEach((node) => !current.has(node) && toRemove.push(node))
  return [toAdd, toRemove]
}

/**
 * Creates a watcher object that allows starting/stopping the watch process.
 * @param originalNode - The node to watch
 * @returns
 */
function createWatcher(originalNode: FormKitNode<any>): FormKitNodeWatcher {
  let dependents = new Set<FormKitNode<any>>()
  let watchingEnabled = false
  const createProxy = (node: FormKitNode<any>) => {
    return new Proxy(node, {
      get(...args) {
        let res = Reflect.get(...args)
        if (watchingEnabled) {
          if (isNode(res) && res !== originalNode) {
            dependents.add(res)
            res = createProxy(res)
          } else if (typeof res === 'function') {
            return (...args: any[]) => {
              let val = res(...args)
              if (isNode(val) && val !== originalNode) {
                dependents.add(val)
                val = createProxy(val)
              }
              return val
            }
          }
        }
        return res
      },
    })
  }
  const node = createProxy(originalNode)
  return {
    start: () => {
      const previous = dependents
      dependents = new Set()
      watchingEnabled = true
      return previous
    },
    end: () => {
      watchingEnabled = false
      return dependents
    },
    node,
  }
}
