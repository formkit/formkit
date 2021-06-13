type FormKitMiddleware<T extends FormKitMiddlewarePayload> = (
  payload: T,
  next: () => T
) => T

interface FormKitMiddlewarePayload {
  [index: string]: any
}

export function createDispatcher<T>() {
  const middleware: FormKitMiddleware<T>[] = []
  let currentIndex = 0
  const run = (payload: T): T => {
    const current = middleware[currentIndex]
    if (typeof current === 'function') {
      return current(payload, () => {
        currentIndex++
        return run(payload)
      })
    }
    return payload
  }

  return {
    use: (dispatchable: FormKitMiddleware<T>) => middleware.push(dispatchable),
    run,
  }
}

// const beforeCommit = createDispatcher<{ [value: string]: number }>()

// beforeCommit.use((payload, next) => {
//   payload.value++
//   return next()
// })

// beforeCommit.run({ value: 123 })
