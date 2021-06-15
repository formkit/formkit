import { jest } from '@jest/globals'
import createDispatcher, { FormKitMiddleware } from '../src/dispatcher'

describe('dispatcher', () => {
  it('can dispatch a value to a single middleware', () => {
    const dispatcher = createDispatcher<{ value: number }>()
    dispatcher.use(function (payload, next) {
      payload.value += 5
      return next()
    })
    expect(dispatcher.run({ value: 123 })).toEqual({ value: 128 })
  })

  it('can dispatch a value to a multiple middleware', () => {
    const dispatcher = createDispatcher<{ value: number }>()
    dispatcher.use(function (payload, next) {
      payload.value = payload.value / 5
      return next()
    })
    dispatcher.use(function (payload, next) {
      payload.value -= 2
      const after = next()
      after.value += 2
      return after
    })
    dispatcher.use(function (payload, next) {
      payload.value += 5
      return next()
    })
    // (20 / 5) - 2 + 5 + 2 = 9
    expect(dispatcher.run({ value: 20 })).toEqual({ value: 9 })
  })

  it('can completely override a given value', () => {
    const dispatcher = createDispatcher<string>()
    dispatcher.use(function (_payload, next) {
      return next('hello')
    })
    dispatcher.use(function (payload, next) {
      return next(payload + ' world')
    })
    expect(dispatcher.run('pizza')).toEqual('hello world')
  })

  it('can modify the return value after calling next', () => {
    const dispatcher = createDispatcher<string>()
    dispatcher.use(function (payload, next) {
      const message = next(payload + ' world')
      return 'Justin' + message
    })
    dispatcher.use((payload, next) => next(`, ${payload}`))
    expect(dispatcher.run('hello')).toEqual('Justin, hello world')
  })

  it('can entire short circuit some middleware by returning a value', () => {
    const dispatcher = createDispatcher<number>()
    const callback: FormKitMiddleware<number> = (value, next) => next(value + 1)
    const aMiddleware = jest.fn(callback)
    dispatcher.use((value, next) => next(value + 1))
    dispatcher.use((value, next) => next(value + 1))
    dispatcher.use(aMiddleware)
    dispatcher.use((value, next) => next(value + 1))
    expect(dispatcher.run(1)).toBe(5)
    expect(aMiddleware.mock.calls.length).toBe(1)
    dispatcher.use(() => 42)
    expect(dispatcher.run(1)).toBe(42)
    // validate that aMiddleware never ran again
    expect(aMiddleware.mock.calls.length).toBe(1)
  })

  it('can modify the return value after calling next', () => {
    const dispatcher = createDispatcher<string>()
    dispatcher.use(function (payload, next) {
      const message = next(payload + ' world')
      return 'Justin' + message
    })
    dispatcher.use((payload, next) => next(`, ${payload}`))
    expect(dispatcher.run('hello')).toEqual('Justin, hello world')
  })

  it('can remove middleware from dispatcher', () => {
    const dispatcher = createDispatcher<string>()
    const middleware: FormKitMiddleware<string> = (value, next) =>
      next(`${value}.`)
    dispatcher.use(middleware)
    expect(dispatcher.run('hello world')).toBe('hello world.')
    dispatcher.remove(middleware)
    expect(dispatcher.run('hello world')).toBe('hello world')
  })
})
