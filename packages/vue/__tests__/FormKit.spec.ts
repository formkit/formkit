import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { FormKitNode } from '@formkit/core'

// Object.assign(defaultConfig.nodeOptions, { validationBehavior: 'live' })

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
    expect(wrapper.html()).toContain(
      '<li class="formkit-message">This is an error</li>'
    )
    expect(wrapper.html()).toContain(
      '<li class="formkit-message">This is another</li>'
    )
    wrapper.setProps({
      errors: ['This is another'],
    })
    await nextTick()
    expect(wrapper.html()).not.toContain(
      '<li class="formkit-message">This is an error</li>'
    )
    expect(wrapper.html()).toContain(
      '<li class="formkit-message">This is another</li>'
    )
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
        validationBehavior: 'live',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toContain('<li class="formkit-message">')
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
            validation-behavior="live"
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
    expect(wrapper.html()).toContain(
      '<li class="formkit-message">ABC should be abc</li>'
    )
  })

  it('can override the validation label', () => {
    const wrapper = mount(
      {
        template: `
          <FormKit
            label="foo"
            :validation="[['required']]"
            validation-label="bar"
            validation-behavior="live"
          />
        `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.html()).toContain(
      '<li class="formkit-message">Bar is required.</li>'
    )
  })

  it('can override the validation label strategy', async () => {
    const wrapper = mount(FormKit, {
      props: {
        label: 'foo',
        validation: 'required',
        validationBehavior: 'live',
        validationLabel: (node: FormKitNode<any>) => {
          return node.props.attrs['data-foo']
        },
        'data-foo': 'hi there',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toContain(
      '<li class="formkit-message">Hi there is required.</li>'
    )
  })

  it('knows the validation state of a form', async () => {
    const wrapper = mount(
      {
        template: `
        <FormKit
          type="group"
          v-slot="{ state: { valid }}"
        >
          <FormKit
            type="text"
            validation="required|email"
            :delay="0"
          />
          <FormKit
            type="text"
            validation="required|length:5"
            :delay="0"
          />
          <button :disabled="!valid">{{ valid }}</button>
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.find('button').attributes()).toHaveProperty('disabled')
    const [email, name] = wrapper.findAll('input')
    email.setValue('info@formkit.com')
    name.setValue('Rockefeller')
    await new Promise((r) => setTimeout(r, 25))
    expect(wrapper.find('button').attributes()).not.toHaveProperty('disabled')
  })

  it('can show validation on blur', async () => {
    const wrapper = mount(FormKit, {
      props: {
        validation: 'required',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('.formkit-messages').exists()).toBe(false)
    wrapper.find('input').trigger('blur')
    await nextTick()
    expect(wrapper.find('.formkit-messages').exists()).toBe(true)
  })

  it('can show validation immediately', async () => {
    const wrapper = mount(FormKit, {
      props: {
        validation: 'required',
        validationBehavior: 'live',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('.formkit-messages').exists()).toBe(true)
  })

  it('can show validation when dirty', async () => {
    const wrapper = mount(FormKit, {
      props: {
        validation: 'required|length:10',
        validationBehavior: 'dirty',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('.formkit-messages').exists()).toBe(false)
    wrapper.find('input').setValue('foo')
    await new Promise((r) => setTimeout(r, 30))
    expect(wrapper.find('.formkit-messages').exists()).toBe(true)
  })
})

describe('configuration', () => {
  it('can change configuration options via prop', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            node1: null as null | FormKitNode<any>,
            node2: null as null | FormKitNode<any>,
            node3: null as null | FormKitNode<any>,
          }
        },
        template: `
        <FormKit
          type="group"
          :config="{
            errorBehavior: 'foobar',
            flavor: 'apple'
          }"
        >
          <FormKit
            type="text"
            @node="(e) => { node1 = e }"
          />
          <FormKit
            type="group"
            :config="{
              errorBehavior: 'live'
            }"
          >
            <FormKit
              type="text"
              error-behavior="barfoo"
              @node="(e) => { node2 = e }"
            />
            <FormKit
              type="text"
              @node="(e) => { node3 = e }"
            />
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
    expect(wrapper.vm.$data.node1?.props.errorBehavior).toBe('foobar')
    expect(wrapper.vm.$data.node2?.props.errorBehavior).toBe('barfoo')
    expect(wrapper.vm.$data.node3?.props.errorBehavior).toBe('live')
  })
})

describe('classes', () => {
  it('renders default classes properly', () => {
    const wrapper = mount(FormKit, {
      props: {
        name: 'classTest',
        label: 'input label',
        help: 'input help text',
        validation: 'required|length:10',
        validationBehavior: 'live',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toBe(`<div class="formkit-outer">
  <div class="formkit-wrapper"><label class="formkit-label">input label</label>
    <div class="formkit-inner"><input type="text" class="formkit-input" name="classTest"></div>
  </div>
  <div class="formkit-help">input help text</div>
  <ul class="formkit-messages">
    <li class="formkit-message">Input label is required.</li>
  </ul>
</div>`)
  })
})
