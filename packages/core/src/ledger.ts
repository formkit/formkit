import { FormKitNode } from './node'
import { FormKitEvent } from './events'
import { FormKitMessage } from './store'
import { has } from '@formkit/utils'

/**
 * The FormKit ledger, a general-purpose message counting service provided by
 * FormKit core for counting messages throughout a tree.
 *
 * @public
 */
export interface FormKitLedger {
  count: (
    name: string,
    condition?: FormKitCounterCondition,
    increment?: number
  ) => Promise<void>
  init: (node: FormKitNode) => void
  merge: (child: FormKitNode) => void
  settled: (name: string) => Promise<void>
  unmerge: (child: FormKitNode) => void
  value: (name: string) => number
}

/**
 * Ledger counters require a condition function that determines if a given
 * message applies to it or not.
 *
 * @public
 */
export interface FormKitCounterCondition {
  (message: FormKitMessage): boolean
}

/**
 * The counter object used to perform instance counting within
 * a tree.
 *
 * @public
 */
export interface FormKitCounter {
  condition: FormKitCounterCondition
  count: number
  name: string
  node: FormKitNode
  promise: Promise<void>
  resolve: () => void
}

/**
 * The internal ledger store structure.
 *
 * @internal
 */
interface FormKitLedgerStore {
  [index: string]: FormKitCounter
}

/**
 * Creates a new ledger for use on a single node's context.
 *
 * @internal
 */
export function createLedger(): FormKitLedger {
  const ledger: FormKitLedgerStore = {}
  let n: FormKitNode
  return {
    count: (...args) => createCounter(n, ledger, ...args),
    init(node: FormKitNode) {
      n = node
      node.on('message-added.deep', add(ledger, 1))
      node.on('message-removed.deep', add(ledger, -1))
    },
    merge: (child) => merge(n, ledger, child),
    settled(counterName: string): Promise<void> {
      return has(ledger, counterName)
        ? ledger[counterName].promise
        : Promise.resolve()
    },
    unmerge: (child) => merge(n, ledger, child, true),
    value(counterName: string) {
      return has(ledger, counterName) ? ledger[counterName].count : 0
    },
  }
}

/**
 * Creates a new counter object in the counting ledger.
 *
 * @param node - FormKitNode
 * @param ledger - The actual ledger storage object
 * @param counterName - The name of the counter, can be arbitrary
 * @param condition - The condition function (or string) that filters messages
 * @param increment - The increment value
 *
 * @internal
 */
function createCounter(
  node: FormKitNode,
  ledger: FormKitLedgerStore,
  counterName: string,
  condition?: FormKitCounterCondition | string,
  increment = 0
): Promise<void> {
  condition = parseCondition(condition || counterName)
  if (!has(ledger, counterName)) {
    const counter: FormKitCounter = {
      condition,
      count: 0,
      name: counterName,
      node,
      promise: Promise.resolve(),
      resolve: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
    }
    ledger[counterName] = counter
    increment = node.store.reduce(
      (sum, m) => sum + (counter.condition(m) as unknown as number) * 1,
      increment
    )
    node.each((child) => {
      child.ledger.count(counter.name, counter.condition)
      increment += child.ledger.value(counter.name)
    })
  }
  return count(ledger[counterName], increment).promise
}

/**
 * We parse the condition to allow flexibility in how counters are specified.
 *
 * @param condition - The condition that, if true, allows a message to change a counter's value
 *
 * @internal
 */
function parseCondition(
  condition: string | FormKitCounterCondition
): FormKitCounterCondition {
  if (typeof condition === 'function') {
    return condition
  }
  return (m: FormKitMessage) => m.type === condition
}

/**
 * Perform a counting action on the a given counter object of the ledger.
 *
 * @param counter - A counter object
 * @param increment - The amount by which we are changing the count value
 *
 * @internal
 */
function count(counter: FormKitCounter, increment: number): FormKitCounter {
  const initial = counter.count
  const post = counter.count + increment
  counter.count = post
  if (initial === 0 && post !== 0) {
    counter.node.emit(`unsettled:${counter.name}`, counter.count, false)
    counter.promise = new Promise((r) => (counter.resolve = r))
  } else if (initial !== 0 && post === 0) {
    counter.node.emit(`settled:${counter.name}`, counter.count, false)
    counter.resolve()
  }
  counter.node.emit(`count:${counter.name}`, counter.count, false)
  return counter
}

/**
 * Returns a function to be used as an event listener for message events.
 *
 * @param ledger - A ledger to operate on
 * @param delta - The amount to add or subtract
 *
 * @internal
 */
function add(ledger: FormKitLedgerStore, delta: number) {
  return (e: FormKitEvent) => {
    for (const name in ledger) {
      const counter = ledger[name]
      if (counter.condition(e.payload)) {
        count(counter, delta)
      }
    }
  }
}

/**
 * Given a child node, add the parent node's counters to the child and then
 * rectify the upstream ledger counts. Generally used when attaching a child
 * to an already counted tree.
 *
 * @param parent - The parent that is "receiving" the child
 * @param ledger - The ledger object
 * @param child - The child (can be a subtree) that is being attached
 * @param remove - If the merge is removing instead of adding
 *
 * @internal
 */
function merge(
  parent: FormKitNode | null,
  ledger: FormKitLedgerStore,
  child: FormKitNode,
  remove = false
) {
  for (const key in ledger) {
    const condition = ledger[key].condition
    if (!remove) child.ledger.count(key, condition)
    const increment = child.ledger.value(key) * (remove ? -1 : 1)

    if (!parent) continue
    do {
      parent.ledger.count(key, condition, increment)
      parent = parent.parent
    } while (parent)
  }
}
