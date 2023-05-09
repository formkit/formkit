import { ref, nextTick, reactive, toRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import defaultConfig from '../src/defaultConfig'
import { plugin } from '../src/plugin'
import { getNode } from '@formkit/core'
import { token } from '@formkit/utils'

describe('v-model', () => {
  it('responds to additions to an array via splice', async () => {
    const values = ref({
      disregard: ['A', 'B'],
      users: [{ name: 'A' }, { name: 'B' }],
    })
    const callback = vi.fn()
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
  })
})
