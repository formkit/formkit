import { ref, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import defaultConfig from '../src/defaultConfig'
import { plugin } from '../src/plugin'
import { FormKitNode, getNode } from '@formkit/core'
import { token } from '@formkit/utils'

describe('v-model', () => {
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

  it('emits a modelUpdated event even when the value results in the same value', async () => {
    const id = token()
    const updatedEventCallback = vi.fn()
    const value = ref('xyz')
    mount(
      {
        setup() {
          const setToFoo = (node: FormKitNode) => {
            node.hook.input((_, next) => {
              return next('foo')
            })
          }
          return { setToFoo, updatedEventCallback, value }
        },
        template: `
        <FormKit
          id="${id}"
          type="text"
          v-model="value"
          @update:modelValue="updatedEventCallback"
          :plugins="[setToFoo]"
        />
      `,
      },
      {
        global: { plugins: [[plugin, defaultConfig]] },
      }
    )
    expect(updatedEventCallback).toHaveBeenCalledTimes(1)
    expect(updatedEventCallback).toHaveBeenLastCalledWith('foo')
    expect(value.value).toBe('foo')

    value.value = 'bar'
    await nextTick()
    expect(updatedEventCallback).toHaveBeenCalledTimes(2)
    expect(updatedEventCallback).toHaveBeenLastCalledWith('foo')
    expect(value.value).toBe('foo')
  })

  it('updates a rendered v-model when the value changes at depth', async () => {
    const wrapper = mount(
      {
        setup() {
          const data = ref({})
          return { data }
        },
        template: `
      <FormKit type="form" v-model="data">
        <FormKit type="group" name="group">
          <FormKit
            type="text"
            name="text"
            label="FormKit Input"
            help="edit me to get started"
            :delay="0"
          />
        </FormKit>
      </FormKit>
      <pre wrap>{{ data }}</pre>`,
      },
      {
        global: { plugins: [[plugin, defaultConfig]] },
      }
    )
    await wrapper.find('input').setValue('foo')
    wrapper.find('input').trigger('input')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('pre').text()).toBe(
      '{\n  "group": {\n    "text": "foo"\n  }\n}'
    )
  })

  it.only('Works with both v-model and model-value', async () => {
    const data1 = ref('abc')
    const data2 = ref('xyz')

    const wrapper = mount(
      {
        setup() {
          return { data1, data2 }
        },
        template: `
          <FormKit type="form" #default="{ value }">
            <FormKit
              v-model="data1"
              type="text"
              name="text-vmodel"
              :delay="0"
            />
            <FormKit
              :model-value="data2"
              type="text"
              name="text-model-value"
              :delay="0"
            />

            <pre wrap>{{ value }}</pre>
          </FormKit>
        `,
      },
      {
        global: { plugins: [[plugin, defaultConfig]] },
      }
    )

    data1.value = 'foo'
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('pre').text()).toMatchSnapshot()
    data2.value = 'bar'
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('pre').text()).toMatchSnapshot()
  })
})
