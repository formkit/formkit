import { createDispatcher } from '../src/dispatcher'

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
    expect(dispatcher.run({ value: 20 })).toEqual({ value: 9 })
  })
})
