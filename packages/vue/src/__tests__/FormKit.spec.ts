import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import FormKit from '../FormKit'
import { plugin } from '../plugin'
import defaultConfig from '../defaultConfig'
import { FormKitNode } from '@formkit/core'

describe('props', () => {
  it('can display prop-defined errors', async () => {
    const wrapper = mount(FormKit, {
      props: {
        errors: ['This is an error', 'This is another'],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toContain('<li>This is an error</li>')
    expect(wrapper.html()).toContain('<li>This is another</li>')
    wrapper.setProps({
      errors: ['This is another'],
    })
    await nextTick()
    expect(wrapper.html()).not.toContain('<li>This is an error</li>')
    expect(wrapper.html()).toContain('<li>This is another</li>')
  })

  it('can only display a single error of the same value', async () => {
    const wrapper = mount(FormKit, {
      props: {
        errors: ['This is an error', 'This is an error'],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.findAll('li').length).toBe(1)
  })
})

describe('v-model', () => {
  it('updates local data when v-model changes', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            name: 'foobar',
          }
        },
        template: `<FormKit v-model="name" :delay="0" />`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('input').element.value).toBe('foobar')
    wrapper.vm.$data.name = 'jane'
    await nextTick()
    expect(wrapper.find('input').element.value).toBe('jane')
    wrapper.find('input').setValue('jon')
    await flushPromises()
    expect(wrapper.vm.$data.name).toBe('jon')
  })
})

describe('events', () => {
  it('emits the node as soon as it is created', () => {
    const wrapper = mount(
      {
        template: '<FormKit @node="e => { node = e }" />',
        data() {
          return {
            node: null as null | FormKitNode<any>,
          }
        },
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.vm.node?.__FKNode__).toBe(true)
  })
})

describe('validation', () => {
  it('shows validation errors on a standard input', () => {
    const wrapper = mount(FormKit, {
      props: {
        validation: 'required|length:5',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toContain('<li>')
  })

  it('can use arbitrarily created validation rules and messages', () => {
    const wrapper = mount(
      {
        template: `
          <FormKit
            label="ABC"
            validation="abc"
            :validation-rules="{
              abc: ({ value }) => value === 'abc'
            }"
            :validation-messages="{
              abc: ({ name }) => name + ' should be abc'
            }"
            value="foo"
          />
        `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.html()).toContain('<li>ABC should be abc</li>')
  })
})
