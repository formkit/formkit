import { mount } from '@vue/test-utils'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { nextTick } from 'vue'
import { token } from '@formkit/utils'
import { getNode, reset } from '@formkit/core'
// import { jest } from '@jest/globals'

describe('group', () => {
  it('can pass values down to children', () => {
    const wrapper = mount(
      {
        template: `
        <div>
          <FormKit type="group" :value="{foo: 'abc', baz: 'hello'}">
            <FormKit name="foo" />
            <FormKit name="bar" />
            <FormKit name="baz" />
          </FormKit>
        </div>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    // TODO - Remove the .get() here when @vue/test-utils > rc.19
    const inputs = wrapper.get('div').findAll('input')
    expect(inputs[0].element.value).toBe('abc')
    expect(inputs[1].element.value).toBe('')
    expect(inputs[2].element.value).toBe('hello')
  })

  it('can mutate v-model values via node.input on child', async () => {
    const groupId = token()
    const wrapper = mount(
      {
        data() {
          return {
            values: { foo: 'abc', baz: 'hello' },
          }
        },
        template: `
        <div>
          <FormKit id="${groupId}" type="group" v-model="values">
            <FormKit name="foo" />
            <FormKit name="bar" />
            <FormKit name="baz" />
          </FormKit>
        </div>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    const group = getNode(groupId)!
    group.at('bar')!.input('this works great')
    await new Promise((r) => setTimeout(r, 25))
    expect(wrapper.vm.values).toStrictEqual({
      foo: 'abc',
      bar: 'this works great',
      baz: 'hello',
    })
  })

  it('does not allow mutations to the initial value object. Issue #72', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            initial: { foo: 'abc', baz: 'hello' },
          }
        },
        template: `
        <div>
          <FormKit type="group" :value="initial">
            <FormKit name="foo" :delay="0" />
            <FormKit name="bar" />
            <FormKit name="baz" />
          </FormKit>
        </div>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    wrapper.find('input').setValue('def')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.vm.initial).toStrictEqual({ foo: 'abc', baz: 'hello' })
  })

  it('can use v-model to change input values', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            formData: {
              name: 'bob',
              address: {
                street: 'jane rd.',
                city: 'crypto city',
              },
            },
            street: 'jane rd.',
          }
        },
        template: `
      <div>
      <FormKit type="group" v-model="formData">
        <FormKit name="name" />
        <FormKit type="group" name="address">
          <FormKit name="street" v-model="street" />
          <FormKit name="city" />
        </FormKit>
      </FormKit>
      </div>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    // const consoleMock = jest.spyOn(console, 'warn').mockImplementation(() => {})
    // TODO - Remove the .get() here when @vue/test-utils > rc.19
    const inputs = wrapper.get('div').findAll('input')
    expect(inputs[0].element.value).toBe('bob')
    expect(inputs[1].element.value).toBe('jane rd.')
    expect(inputs[2].element.value).toBe('crypto city')
    inputs[1].setValue('foo rd.')
    await new Promise((r) => setTimeout(r, 30))
    expect(wrapper.vm.$data.formData).toEqual({
      name: 'bob',
      address: {
        street: 'foo rd.',
        city: 'crypto city',
      },
    })
    expect(wrapper.vm.$data.street).toBe('foo rd.')
    // expect(consoleMock).toHaveBeenCalled()
    // consoleMock.mockRestore()
  })

  it('can reactively disable and enable all inputs in a group', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            disabled: false,
          }
        },
        template: `<FormKit
          type="group"
          :disabled="disabled"
        >
          <FormKit id="disabledEmail" type="email" />
          <FormKit id="disabledSelect" type="select" />
        </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('[data-disabled] input[disabled]').exists()).toBe(false)
    expect(wrapper.find('[data-disabled] select[disabled]').exists()).toBe(
      false
    )
    wrapper.setData({ disabled: true })
    await nextTick()
    expect(wrapper.find('[data-disabled] input[disabled]').exists()).toBe(true)
    expect(wrapper.find('[data-disabled] select[disabled]').exists()).toBe(true)
  })
})

describe('clearing values', () => {
  it('can remove values from a group by setting it to an empty object', async () => {
    const emailToken = token()
    const wrapper = mount(
      {
        data() {
          return {
            data: {} as Record<string, any>,
          }
        },
        template: `
        <FormKit type="group" v-model="data" id="groupId">
          <FormKit name="name" />
          <FormKit name="email" id="${emailToken}" value="example@example.com" />
          <FormKit type="group" name="address">
            <FormKit name="street" />
            <FormKit type="checkbox" name="type" :value="['residential']" :options="['residential', 'commercial']" />
          </FormKit>
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    await nextTick()
    const node = getNode(emailToken)
    expect(node!.value).toEqual('example@example.com')
    expect(wrapper.vm.data).toStrictEqual({
      name: undefined,
      email: 'example@example.com',
      address: {
        street: undefined,
        type: ['residential'],
      },
    })
    // Now we v-model the data to an empty object:
    wrapper.vm.data = {}
    await nextTick()
    expect(wrapper.vm.data).toStrictEqual({
      name: undefined,
      email: undefined,
      address: {
        street: undefined,
        type: [],
      },
    })
  })

  it('can reset values to their original state', async () => {
    const formToken = token()
    const wrapper = mount(
      {
        data() {
          return {
            data: {
              address: {
                street: 'Kiev St.',
              },
            } as Record<string, any>,
          }
        },
        template: `
        <div>
          <FormKit type="group" id="${formToken}" v-model="data">
            <FormKit name="name" />
            <FormKit name="email" value="example@example.com" />
            <FormKit type="group" name="address">
              <FormKit name="street" />
              <FormKit type="checkbox" name="type" :value="['residential']" :options="['residential', 'commercial']" />
            </FormKit>
          </FormKit>
        </div>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.vm.data).toStrictEqual({
      name: undefined,
      email: 'example@example.com',
      address: {
        street: 'Kiev St.',
        type: ['residential'],
      },
    })
    await nextTick()
    wrapper.vm.data = {
      name: 'Volodymyr Zelenskyy',
      email: 'volo@ukraine.ua',
      address: {
        street: 'Verkhovna Rada',
        type: ['commercial'],
      },
    }
    await nextTick()
    const [name, email, street, residential, commercial] = wrapper
      .get('div')
      .findAll('input')
    expect(name.element.value).toBe('Volodymyr Zelenskyy')
    expect(email.element.value).toBe('volo@ukraine.ua')
    expect(street.element.value).toBe('Verkhovna Rada')
    expect(commercial.element.checked).toBe(true)
    expect(residential.element.checked).toBe(false)
    // Now we v-model the data to an empty object:
    await nextTick()
    reset(formToken)
    await nextTick()
    expect(wrapper.vm.data).toStrictEqual({
      name: undefined,
      email: 'example@example.com',
      address: {
        street: 'Kiev St.',
        type: ['residential'],
      },
    })
  })

  it('can output reactive values without a v-model using context.value', async () => {
    const groupId = token()
    const wrapper = mount(
      {
        template: `<FormKit id="${groupId}" type="group" #default="{ value }">
        <pre>{{ value }}</pre>
        <FormKit name="user" value="abc"/>
      </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(getNode(groupId)!.value).toStrictEqual({ user: 'abc' })
    await nextTick()
    expect(wrapper.find('pre').html()).toBe(`<pre>{
  "user": "abc"
}</pre>`)
  })
})
