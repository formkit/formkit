import { ref, nextTick, reactive, toRef } from 'vue'
import watchVerbose, { getPaths } from '../src/composables/watchVerbose'
import { jest } from '@jest/globals'
import { mount } from '@vue/test-utils'
import defaultConfig from '../src/defaultConfig'
import { plugin } from '../src/plugin'
import { getNode } from '@formkit/core'
import { token } from '@formkit/utils'

describe('getPaths', () => {
  it('retrieves single-depth paths', () => {
    const x = { a: '1', b: '2', c: '3' }
    expect(getPaths(x)).toStrictEqual([[], ['a'], ['b'], ['c']])
  })

  it('retrieves slightly nested paths', () => {
    const x = {
      a: {
        b: '2',
      },
      c: '3',
    }
    expect(getPaths(x)).toStrictEqual([[], ['a'], ['a', 'b'], ['c']])
  })

  it('retrieves nested array paths', () => {
    const x = {
      a: {
        b: ['x', 'y', 'z'],
      },
      c: '3',
    }
    expect(getPaths(x)).toStrictEqual([
      [],
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
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    value.value = { a: { b: '456' } }
    await nextTick()
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

  it('can change the same property twice synchronously', async () => {
    const value = ref({ a: '123' })
    const callback = jest.fn()
    watchVerbose(value, callback)
    value.value.a = '456'
    value.value.a = '567'
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenNthCalledWith(1, ['a'], '567', value)
  })

  it('works with reactive objects', async () => {
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
    await nextTick()
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

  it('responds to new additions on vue reactive objects', async () => {
    const values = reactive<{ a?: string }>({})
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.a = '123'
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith([], { a: '123' }, values)
  })

  it('responds to additions on vue reactive objects at depth', async () => {
    const values = reactive<{ form: { a?: string } }>({
      form: {},
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.form.a = '123'
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(['form'], { a: '123' }, values)
    values.form.a = 'bar'
    await nextTick()
    expect(callback).toHaveBeenCalledWith(['form', 'a'], 'bar', values)
  })

  it('responds to additions to an array via splice', async () => {
    const values = ref({
      disregard: ['A', 'B'],
      users: [{ name: 'A' }, { name: 'B' }],
    })
    const callback = jest.fn()
    watchVerbose(values, callback)
    values.value.users.shift()
    await nextTick()
    values.value.users.splice(
      1,
      2,
      { name: 'splice' },
      { name: 'double spliced' }
    )
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(4)
    expect(callback).toHaveBeenNthCalledWith(
      4,
      ['users'],
      [{ name: 'B' }, { name: 'splice' }, { name: 'double spliced' }],
      values
    )
  })

  it('detects changes to arrays that are v-modeled', async () => {
    const usersId = token()
    const wrapper = mount(
      {
        setup(_props, context) {
          const values = ref<{ users: any[] }>({
            users: [{ name: 'foo' }, { name: 'bar' }],
          })
          context.expose({ values })
          return { values }
        },
        template: `
        <FormKit type="group" v-model="values">
          <FormKit type="list" name="users" id="${usersId}" v-slot="{ value }">
            <FormKit type="group" :index="0" v-if="value && value.length > 0">
              <FormKit name="name"/>
            </FormKit>
            <FormKit type="group" :index="1" v-if="value && value.length > 1">
              <FormKit name="name" />
            </FormKit>
          </FormKit>
        </FormKit>`,
      },
      {
        global: { plugins: [[plugin, defaultConfig]] },
      }
    )
    const usersNode = getNode(usersId)!.use((node) => {
      if (node.type === 'group') {
        node.hook.input((value, next) => {
          if (value === undefined) node.destroy()
          return next(value || {})
        })
      }
    })
    await nextTick()
    expect(usersNode.value).toStrictEqual([{ name: 'foo' }, { name: 'bar' }])
    wrapper.vm.values.users[0].name = 'baz'
    wrapper.vm.values.users[1].name = 'fiz'
    await nextTick()
    const inputs = wrapper.findAll('input')
    expect(inputs.at(0)?.element.value).toBe('baz')
    expect(inputs.at(1)?.element.value).toBe('fiz')
    // wrapper.vm.values.users.shift()
    // await nextTick()
    // expect(usersNode.children.length).toBe(1)
    // expect(usersNode.value).toStrictEqual([{ name: 'bar' }])
    // wrapper.vm.values.users[1] = { name: 'foo' }
    // await nextTick()
    // expect(usersNode.value).toStrictEqual([{ name: 'bar' }, { name: 'foo' }])
  })
})
