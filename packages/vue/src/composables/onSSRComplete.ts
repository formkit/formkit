import { App } from 'vue'

/**
 * A flag indicating if this is (likely) a server context.
 */
const isServer = typeof window === 'undefined'

/**
 * A map of Vue applications to a set of callbacks to be flushed after SSR is
 * complete.
 */
const ssrCompleteRegistry = new WeakMap<App<any>, Set<CallableFunction>>()

/**
 * Flush all callbacks registered with onSSRComplete for a given app.
 * @param app - The Vue application.
 * @public
 */
export function ssrComplete(app: App<any>) {
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
 * Register a callback for when SSR is complete. No-op if not in a server
 * context.
 * @param app - The Vue application.
 * @param callback - The callback to be called after SSR is complete.
 * @public
 */
export function onSSRComplete(
  app: App<any> | undefined,
  callback: CallableFunction
) {
  if (!isServer || !app) return
  if (!ssrCompleteRegistry.has(app)) ssrCompleteRegistry.set(app, new Set())
  ssrCompleteRegistry.get(app)?.add(callback)
}
