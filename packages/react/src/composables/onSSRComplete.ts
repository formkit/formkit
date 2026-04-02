/**
 * A flag indicating if this is (likely) a server context.
 */
const isServer = typeof window === 'undefined'

/**
 * Map of app/root handles to cleanup callbacks for SSR.
 */
const ssrCompleteRegistry = new Map<object, Set<CallableFunction>>()

/**
 * Flush callbacks registered with onSSRComplete for a given app/root handle.
 */
export function ssrComplete(app: object) {
  if (!isServer) return
  const callbacks = ssrCompleteRegistry.get(app)
  if (!callbacks) return
  for (const callback of callbacks) {
    callback()
  }
  callbacks.clear()
  ssrCompleteRegistry.delete(app)
}

/**
 * Register a callback for when SSR is complete.
 */
export function onSSRComplete(
  app: object | undefined,
  callback: CallableFunction
) {
  if (!isServer || !app) return
  if (!ssrCompleteRegistry.has(app)) ssrCompleteRegistry.set(app, new Set())
  ssrCompleteRegistry.get(app)?.add(callback)
}
