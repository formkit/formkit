import type { FormKitNode } from './node'
import { warn } from './errors'

/**
 * Development helper: warn when a live node already owns an id. The check runs
 * after the current task so legitimate hand-offs (HMR, React StrictMode or
 * keyed remounts, where the old node is destroyed right after the new one
 * registers) don't warn. A classic cause is a fixed `id` on an input inside a
 * repeater (#1412).
 *
 * @param id - The id being registered.
 * @param node - The node registering the id.
 * @param existing - The node currently registered with that id, if any.
 * @param ownsId - Returns whether a node is still registered under `id`.
 *
 * @internal
 */
export function warnOnDuplicateId(
  id: string,
  node: FormKitNode,
  existing: FormKitNode | undefined,
  ownsId: (node: FormKitNode) => boolean
): void {
  if (!existing || existing === node) return
  setTimeout(() => {
    if (ownsId(existing) && ownsId(node)) warn(153, id)
  }, 0)
}
