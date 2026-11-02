import type { FormKitNode } from '@formkit/core'

/**
 * React may render a component and then throw that render away without ever
 * committing it: StrictMode's double render (React 18 re-runs the mount render
 * with fresh hooks), Suspense retries, interrupted or superseded transitions.
 * FormKit nodes are created during render because children need their parent
 * node while rendering, and creating a node attaches it to its parent. A
 * discarded render therefore leaves a "ghost" node in the parent form, which
 * can block submission forever (see #1776).
 *
 * To prevent that, nodes created during render start out *unclaimed*:
 *
 * - They are indexed by the component's props object. React passes the very
 *   same props object to both calls of a StrictMode double render (React 18
 *   re-runs the mount render with *fresh hooks*, so refs/state can't be used),
 *   and siblings never share a props object, so a repeated render of the same
 *   element reuses the pending node instead of creating a duplicate. (useId is
 *   not stable here: client mounts get ids from a global counter.)
 * - When the parent itself re-renders (new props objects) a pending node with
 *   the same parent, type and explicit name is reused. Without this a sibling
 *   that suspends inside a transition re-creates the node on every retry, and
 *   each new node re-renders the form, which retries again (an endless loop).
 * - The component claims its node in a layout effect (i.e. on commit).
 * - Nodes that are never claimed are destroyed after a grace period.
 * - If a component commits with a node that was already destroyed (a very slow
 *   render that got swept, or an <Activity> that hid and showed again), the
 *   component recreates it (see useInput).
 *
 * @internal
 */

/** Grace period before an unclaimed (never committed) node is destroyed. */
export const UNCLAIMED_NODE_TTL = 1000

const unclaimed = new WeakMap<object, FormKitNode>()
const unclaimedKeys = new WeakMap<FormKitNode, object>()
const rootOwner = {}
const unclaimedByName = new WeakMap<object, Map<string, FormKitNode>>()
const nameKeys = new WeakMap<FormKitNode, [object, string]>()
const destroyed = new WeakSet<FormKitNode>()
const isServer = typeof window === 'undefined'
let pendingRenderKey: object | undefined

/**
 * Lets a component hand the *original* props object of the current render to
 * useInput (components usually spread props before calling it).
 */
export function setRenderKey(key: object) {
  pendingRenderKey = key
}

/**
 * Returns (and clears) the render key set for this render, or the fallback.
 */
export function takeRenderKey(fallback: object): object {
  const key = pendingRenderKey ?? fallback
  pendingRenderKey = undefined
  return key
}

/**
 * Returns a pending (rendered but never committed) node created by a previous
 * render of the same element, if it is still alive and has the same parent.
 */
export function findUnclaimed(
  key: object,
  parent: FormKitNode | null | undefined,
  nameKey?: string
): FormKitNode | undefined {
  const sameParent = (node: FormKitNode | undefined) =>
    node &&
    !destroyed.has(node) &&
    (node.parent ?? null) === (parent ?? null)
  const byProps = unclaimed.get(key)
  if (sameParent(byProps)) return byProps
  if (nameKey) {
    const byName = unclaimedByName.get(parent ?? rootOwner)?.get(nameKey)
    if (sameParent(byName)) return byName
  }
  return undefined
}

/**
 * Tracks a freshly created node as unclaimed and schedules its destruction if
 * no committed component claims it in time.
 */
export function trackUnclaimed(
  key: object,
  node: FormKitNode,
  parent: FormKitNode | null | undefined,
  nameKey?: string
) {
  watchDestroyed(node)
  // On the server nothing commits; SSR cleanup is handled by onSSRComplete.
  if (isServer) return
  unclaimed.set(key, node)
  unclaimedKeys.set(node, key)
  if (nameKey) {
    const owner = parent ?? rootOwner
    let byName = unclaimedByName.get(owner)
    if (!byName) unclaimedByName.set(owner, (byName = new Map()))
    byName.set(nameKey, node)
    nameKeys.set(node, [owner, nameKey])
  }
  setTimeout(() => {
    if (unclaimedKeys.has(node) && !destroyed.has(node)) node.destroy()
  }, UNCLAIMED_NODE_TTL)
}

/**
 * Marks a node as owned by a committed component.
 */
export function claim(node: FormKitNode) {
  const key = unclaimedKeys.get(node)
  if (!key) return
  unclaimedKeys.delete(node)
  if (unclaimed.get(key) === node) unclaimed.delete(key)
  const named = nameKeys.get(node)
  if (named) {
    nameKeys.delete(node)
    const byName = unclaimedByName.get(named[0])
    if (byName?.get(named[1]) === node) byName.delete(named[1])
  }
}

/**
 * Whether a node has been destroyed.
 */
export function isDestroyed(node: FormKitNode): boolean {
  return destroyed.has(node)
}

function watchDestroyed(node: FormKitNode) {
  node.on('destroyed', () => {
    destroyed.add(node)
    claim(node)
  })
}
