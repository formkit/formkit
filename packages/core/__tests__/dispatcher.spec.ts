import { jest } from '@jest/globals'
import type { FormKitMiddleware } from '../src/dispatcher';
import createDispatcher from '../src/dispatcher'

describe('dispatcher', () => {
  it('can dispatch a value to a single middleware', () => {
    const dispatcher = createDispatcher<{ value: number }>()
    dispatcher(function (payload, next) {
      payload.value += 5
      return next()
    })
    expect(dispatcher.dispatch({ value: 123 })).toEqual({ value: 128 })
  })

  it('can dispatch a value to a multiple middleware', () => {
    const dispatcher = createDispatcher<{ value: number }>()
    dispatcher(function (payload, next) {
      payload.value = payload.value / 5
      return next()
    })
    dispatcher(function (payload, next) {
      payload.value -= 2
      const after = next()
      after.value += 2
      return after
    })
    dispatcher(function (payload, next) {
      payload.value += 5
      return next()
    })
    // (20 / 5) - 2 + 5 + 2 = 9
    expect(dispatcher.dispatch({ value: 20 })).toEqual({ value: 9 })
  })

  it('can completely override a given value', () => {
    const dispatcher = createDispatcher<string>()
    dispatcher(function (_payload, next) {
      return next('hello')
    })
    dispatcher(function (payload, next) {
      return next(payload + ' world')
    })
    expect(dispatcher.dispatch('pizza')).toEqual('hello world')
  })

  it('can modify the return value after calling next', () => {
    const dispatcher = createDispatcher<string>()
    dispatcher(function (payload, next) {
      const message = next(payload + ' world')
      return 'Justin' + message
    })
    dispatcher((payload, next) => next(`, ${payload}`))
    expect(dispatcher.dispatch('hello')).toEqual('Justin, hello world')
  })

  it('can entire short circuit some middleware by returning a value', () => {
    const dispatcher = createDispatcher<number>()
    const callback: FormKitMiddleware<number> = (value, next) => next(value + 1)
    const aMiddleware = jest.fn(callback)
    dispatcher((value, next) => next(value + 1))
    dispatcher((value, next) => next(value + 1))
    dispatcher(aMiddleware)
    dispatcher((value, next) => next(value + 1))
    expect(dispatcher.dispatch(1)).toBe(5)
    expect(aMiddleware.mock.calls.length).toBe(1)
    dispatcher.unshift(() => 42)
    expect(dispatcher.dispatch(1)).toBe(42)
    // validate that aMiddleware never ran again
    expect(aMiddleware.mock.calls.length).toBe(1)
  })

  it('can modify the return value after calling next', () => {
    const dispatcher = createDispatcher<string>()
    dispatcher(function (payload, next) {
      const message = next(payload + ' world')
      return 'Justin' + message
    })
    dispatcher((payload, next) => next(`, ${payload}`))
    expect(dispatcher.dispatch('hello')).toEqual('Justin, hello world')
  })

  it('can remove middleware from dispatcher', () => {
    const dispatcher = createDispatcher<string>()
    const middleware: FormKitMiddleware<string> = (value, next) =>
      next(`${value}.`)
    dispatcher(middleware)
    expect(dispatcher.dispatch('hello world')).toBe('hello world.')
    dispatcher.remove(middleware)
    expect(dispatcher.dispatch('hello world')).toBe('hello world')
  })
})
