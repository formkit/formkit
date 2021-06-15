export type FormKitMiddleware<T> = (payload: T, next: (payload?: T) => T) => T

export default function createDispatcher<T>() {
  const middleware: FormKitMiddleware<T>[] = []
  let currentIndex = 0
  const run = (payload: T): T => {
    const current = middleware[currentIndex]
    if (typeof current === 'function') {
      return current(payload, (explicitPayload?: T) => {
        currentIndex++
        return run(explicitPayload === undefined ? payload : explicitPayload)
      })
    }
    return payload
  }

  return {
    use: (dispatchable: FormKitMiddleware<T>) => middleware.push(dispatchable),
    remove: (dispatchable: FormKitMiddleware<T>) => {
      const index = middleware.indexOf(dispatchable)
      if (index > -1) middleware.splice(index, 1)
    },
    run,
  }
}
