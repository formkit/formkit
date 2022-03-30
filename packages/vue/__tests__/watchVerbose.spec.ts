import { ref } from 'vue'
import watchVerbose, { getPaths } from '../src/composables/watchVerbose'
import { jest } from '@jest/globals'

const doubleTick = () => new Promise((r) => setTimeout(r, 1))

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
})

describe('watchVerbose', () => {
  it('can detect single level depth mutations', async () => {
    const values = ref({ a: 'a', b: 'b' })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.b = 'c'
    await doubleTick()
    expect(callback).toHaveBeenCalledWith(['b'], 'c', values)
    values.value.b = 'd'
    await doubleTick()
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
    await doubleTick()
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
    await doubleTick()
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
    await doubleTick()
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
    await doubleTick()
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
    await doubleTick()
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
    await doubleTick()
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
    await doubleTick()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(
      ['a', 'b'],
      [{ x: 123 }, { x: 456 }, { x: 789 }, { a: 567 }],
      values
    )
    values.value.a.b[3].a = 8910
    await doubleTick()
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
    await doubleTick()
    values.value.a.b[0] = 'barfoo'
    await doubleTick()
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenNthCalledWith(
      2,
      ['a', 'b', '0'],
      'barfoo',
      values
    )
  })
})
