import { useMemo, useSyncExternalStore } from 'react'

export interface FormKitReactiveStore {
  version: number
  pending: boolean
  subscribers: Set<() => void>
}

export const formKitReactiveStoreSymbol = Symbol.for(
  'FormKitReactiveStore'
) as symbol

function isObject(value: unknown): value is Record<PropertyKey, any> {
  return typeof value === 'object' && value !== null
}

export function getReactiveStore(
  target: unknown
): FormKitReactiveStore | undefined {
  if (!isObject(target)) return undefined
  return target[formKitReactiveStoreSymbol] as FormKitReactiveStore | undefined
}

export function ensureReactiveStore(target: unknown): FormKitReactiveStore {
  if (!isObject(target)) {
    throw new Error('FormKit reactive stores can only be attached to objects.')
  }
  const existing = getReactiveStore(target)
  if (existing) return existing
  const store: FormKitReactiveStore = {
    version: 0,
    pending: false,
    subscribers: new Set(),
  }
  Object.defineProperty(target, formKitReactiveStoreSymbol, {
    value: store,
    enumerable: false,
    configurable: true,
    writable: false,
  })
  return store
}

export function notifyReactiveStore(target: unknown): void {
  const store = getReactiveStore(target)
  if (!store) return
  store.version++
  if (store.pending) return
  store.pending = true
  queueMicrotask(() => {
    store.pending = false
    // Notify a stable snapshot so re-subscriptions during render don't
    // recursively extend this notification pass.
    const subscribers = Array.from(store.subscribers)
    subscribers.forEach((subscriber) => subscriber())
  })
}

export function clearReactiveStore(target: unknown): void {
  const store = getReactiveStore(target)
  if (!store) return
  store.subscribers.clear()
}

export function subscribeReactiveStore(
  target: unknown,
  subscriber: () => void
): () => void {
  const store = getReactiveStore(target)
  if (!store) return () => {
    /* noop */
  }
  store.subscribers.add(subscriber)
  return () => {
    store.subscribers.delete(subscriber)
  }
}

export function useReactiveStore(target: unknown): void {
  const stableTarget = useMemo(() => target, [target])
  const subscribe = (subscriber: () => void) =>
    subscribeReactiveStore(stableTarget, subscriber)
  const getSnapshot = () => getReactiveStore(stableTarget)?.version ?? 0
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
