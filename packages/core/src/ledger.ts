import { FormKitNode } from './node'
import { FormKitEvent } from './events'
import { has } from '@formkit/utils'

/**
 * The FormKit ledger, a general-purpose message counting service provided by
 * FormKit core for counting messages throughout a tree.
 * @public
 */
export interface FormKitLedger {
  init: (node: FormKitNode<any>) => void
  count: (name: string, increment?: number) => Promise<void>
  settled: (name: string) => Promise<void>
  value: (name: string) => number
}

/**
 * The internal ledger store structure.
 * @internal
 */
interface FormKitLedgerStore {
  [index: string]: [count: number, p: Promise<void>, resolve: () => void]
}

/**
 * Creates a new ledger for use on a single node's context.
 * @returns
 */
export function createLedger(): FormKitLedger {
  const ledger: FormKitLedgerStore = {}
  function count(name: string, increment = 0): Promise<void> {
    let initialCount = 0
    if (has(ledger, name)) {
      initialCount = ledger[name][0]
    } else {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      ledger[name] = [initialCount, Promise.resolve(), () => {}]
    }
    const postCount = initialCount + increment
    if (initialCount !== 0 && postCount === 0) {
      // Resolve the promise, we're back down to zero folks
      ledger[name][2]()
    } else if (initialCount === 0 && postCount !== 0) {
      ledger[name][1] = new Promise<void>((resolve) => {
        ledger[name][2] = resolve
      })
    }
    ledger[name][0] = postCount
    return ledger[name][1]
  }
  const add = (val: number) => (e: FormKitEvent) =>
    has(ledger, e.payload.type) && count(e.payload.type, val)
  return {
    count,
    init(node: FormKitNode<any>) {
      node.on('message-added.deep', add(1))
      node.on('message-removed.deep', add(-1))
    },
    settled(name: string): Promise<void> {
      if (has(ledger, name)) {
        return ledger[name][1]
      }
      return Promise.resolve()
    },
    value(name: string) {
      if (has(ledger, name)) {
        return ledger[name][0]
      }
      return 0
    },
  }
}
