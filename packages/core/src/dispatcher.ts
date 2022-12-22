/**
 * All FormKitMiddleware conform to the pattern of accepting a payload and a
 * `next()` function. They can either pass the payload to the next middleware
 * explicitly (as an argument of next), or implicitly (no argument for next).
 * @internal
 */
export type FormKitMiddleware<T = unknown> = (
  payload: T,
  next: (payload?: T) => T
) => T

/**
 * The FormKitDispatcher interface is responsible creating/running "hooks".
 * @internal
 */
export interface FormKitDispatcher<T> {
  (dispatchable: FormKitMiddleware<T>): number
  unshift: (dispatchable: FormKitMiddleware<T>) => number
  remove: (dispatchable: FormKitMiddleware<T>) => void
  dispatch: (payload: T) => T
}
/**
 * Creates a new dispatcher that allows the addition/removal of middleware
 * functions, and the ability to dispatch a payload to all middleware.
 * @returns FormKitDispatcher
 */
export default function createDispatcher<T>(): FormKitDispatcher<T> {
  const middleware: FormKitMiddleware<T>[] = []
  let currentIndex = 0
  const use = (dispatchable: FormKitMiddleware<T>) =>
    middleware.push(dispatchable)
  const dispatch = (payload: T): T => {
    const current = middleware[currentIndex]
    if (typeof current === 'function') {
      return current(payload, (explicitPayload?: T) => {
        currentIndex++
        return dispatch(
          explicitPayload === undefined ? payload : explicitPayload
        )
      })
    }
    currentIndex = 0
    return payload
  }
  use.dispatch = dispatch
  use.unshift = (dispatchable: FormKitMiddleware<T>) =>
    middleware.unshift(dispatchable)
  use.remove = (dispatchable: FormKitMiddleware<T>) => {
    const index = middleware.indexOf(dispatchable)
    if (index > -1) middleware.splice(index, 1)
  }
  return use
}
