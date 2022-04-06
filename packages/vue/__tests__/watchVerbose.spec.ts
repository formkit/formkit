import { ref, nextTick, reactive, toRef } from 'vue'
import watchVerbose, { getPaths } from '../src/composables/watchVerbose'
import { jest } from '@jest/globals'

describe('getPaths', () => {
  it('retrieves single-depth paths', () => {
    const x = { a: '1', b: '2', c: '3' }
    expect(getPaths(x)).toStrictEqual([['a'], ['b'], ['c']])
  })

  it('retrieves slightly nested paths', () => {
    const x = {
      a: {
        b: '2',
      },
      c: '3',
    }
    expect(getPaths(x)).toStrictEqual([['a'], ['a', 'b'], ['c']])
  })

  it('retrieves nested array paths', () => {
    const x = {
      a: {
        b: ['x', 'y', 'z'],
      },
      c: '3',
    }
    expect(getPaths(x)).toStrictEqual([
      ['a'],
      ['a', 'b'],
      ['a', 'b', '0'],
      ['a', 'b', '1'],
      ['a', 'b', '2'],
      ['c'],
    ])
  })

  it('includes a root path when passed a ref', () => {
    expect(
      getPaths(
        ref({
          a: {
            b: 'c',
          },
        })
      )
    ).toStrictEqual([[], ['a'], ['a', 'b']])
  })
})

describe('watchVerbose', () => {
  it('can detect single level depth mutations', async () => {
    const values = ref({ a: 'a', b: 'b' })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.b = 'c'
    await nextTick()
    expect(callback).toHaveBeenCalledWith(['b'], 'c', values)
    values.value.b = 'd'
    await nextTick()
    expect(callback).toHaveBeenCalledWith(['b'], 'd', values)
  })

  it('can detect double level depth mutations', async () => {
    const values = ref({
      a: {
        b: 'c',
      },
      z: 'e',
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.a.b = 'foobar'
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(['a', 'b'], 'foobar', values)
  })

  it('can detect root changes when there is depth', async () => {
    const values = ref<any>({
      a: {
        b: 'c',
      },
      z: 'e',
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.z = 'foobar'
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(['z'], 'foobar', values)
  })

  it('can detect property additions', async () => {
    const values = ref<any>({
      a: {
        b: 'c',
      },
      z: 'e',
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.a.c = 'foobar'
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(
      ['a'],
      { b: 'c', c: 'foobar' },
      values
    )
  })

  it('can detect property changes at several layers of depth', async () => {
    const values = ref<any>({
      a: {
        b: {
          c: {
            z: 'f',
          },
        },
      },
      z: 'e',
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.a.b.c = { z: 'h' }
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenNthCalledWith(
      1,
      ['a', 'b', 'c'],
      { z: 'h' },
      values
    )
  })

  it('can detect changes to an array', async () => {
    const values = ref<any>({
      a: {
        b: [{ x: 123 }, { x: 456 }, { x: 789 }],
      },
      z: 'e',
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.a.b.push({ x: 10 })
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(
      ['a', 'b'],
      [{ x: 123 }, { x: 456 }, { x: 789 }, { x: 10 }],
      values
    )
  })

  it('can detect changes within an array', async () => {
    const values = ref<any>({
      a: {
        b: [{ x: 123 }, { x: 456 }, { x: 789 }],
      },
      z: 'e',
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.a.b[1].x = 567
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(['a', 'b', '1', 'x'], 567, values)
  })

  it('can detect changes inside a new object', async () => {
    const values = ref<any>({
      a: {
        b: [{ x: 123 }, { x: 456 }, { x: 789 }],
      },
      z: 'e',
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.a.b.push({ a: 567 })
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(
      ['a', 'b'],
      [{ x: 123 }, { x: 456 }, { x: 789 }, { a: 567 }],
      values
    )
    values.value.a.b[3].a = 8910
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenNthCalledWith(
      2,
      ['a', 'b', '3', 'a'],
      8910,
      values
    )
  })

  it('can change the type at a given location and observe its changes', async () => {
    const values = ref<any>({
      a: {
        b: [{ x: 123 }, { x: 456 }, { x: 789 }],
      },
      z: 'e',
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.a.b[0] = 'foobar'
    await nextTick()
    values.value.a.b[0] = 'barfoo'
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenNthCalledWith(
      2,
      ['a', 'b', '0'],
      'barfoo',
      values
    )
  })

  it('can detect changes at the root of the ref', async () => {
    const value = ref('abc')
    const callback = jest.fn()
    watchVerbose(value, callback)
    value.value = 'def'
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith([], 'def', value)
  })

  it('can remove and replace old properties without getting watch sequence out of order', async () => {
    const value = ref<Record<string, any> | string>({
      a: {
        b: '123',
      },
    })
    const callback = jest.fn()
    watchVerbose(value, callback)
    value.value = 'foobar'
    expect(callback).toHaveBeenCalledTimes(1)
    await nextTick()
    value.value = { a: { b: '456' } }
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenNthCalledWith(2, [], { a: { b: '456' } }, value)
  })

  it('can set values that start with the same string', async () => {
    const values = ref({
      price: 7,
      prices: [5],
      cart: {
        price: 4,
      },
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.price = 0
    values.value.prices[0] = 0
    values.value.cart.price = 0
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(3)
    expect(callback).toHaveBeenNthCalledWith(1, ['price'], 0, values)
    expect(callback).toHaveBeenNthCalledWith(2, ['prices', '0'], 0, values)
    expect(callback).toHaveBeenNthCalledWith(3, ['cart', 'price'], 0, values)
  })

  it('can change the same property twice synchronously', () => {
    const value = ref({ a: '123' })
    const callback = jest.fn()
    watchVerbose(value, callback)
    value.value.a = '456'
    value.value.a = '567'
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenNthCalledWith(1, ['a'], '456', value)
    expect(callback).toHaveBeenNthCalledWith(2, ['a'], '567', value)
  })

  it('works with reactive objects', () => {
    const value = reactive({
      a: {
        b: {
          c: 123,
        },
      },
    })
    const callback = jest.fn()
    watchVerbose(value, callback)
    value.a.b.c = 456
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenNthCalledWith(1, ['a', 'b', 'c'], 456, value)
  })

  it('unwatches objects that are detached from the original ref', async () => {
    const values = ref<any>({
      a: {
        b: {
          c: 123,
        },
      },
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    const detached = toRef(values.value.a, 'b')
    values.value.a = 'foobar'
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    detached.value.c = 'bar'
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
