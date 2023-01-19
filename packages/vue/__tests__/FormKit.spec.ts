import { nextTick, h, reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { FormKitNode, FormKitEvent, setErrors } from '@formkit/core'
import { token } from '@formkit/utils'
import { getNode, createNode } from '@formkit/core'
import { FormKitValidationRule } from '@formkit/validation'
import vuePlugin from '../src/bindings'
import { jest } from '@jest/globals'

// Object.assign(defaultConfig.nodeOptions, { validationVisibility: 'live' })

describe('props', () => {
  it('uses the input definition’s forceTypeProp instead of the type', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'foo',
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              inputs: {
                foo: {
                  type: 'input',
                  forceTypeProp: 'bar',
                  schema: ['$type'],
                },
              },
            }),
          ],
        ],
      },
    })

    expect(wrapper.html()).toBe('bar')
  })

  it('can display prop-defined errors', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        errors: ['This is an error', 'This is another'],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toContain(
      `<li class="formkit-message" id="${id}-this-is-an-error" data-message-type="error">This is an error</li>`
    )
    expect(wrapper.html()).toContain(
      `<li class="formkit-message" id="${id}-this-is-another" data-message-type="error">This is another</li>`
    )
    wrapper.setProps({
      errors: ['This is another'],
    })
    await nextTick()
    expect(wrapper.html()).not.toContain(
      '<li class="formkit-message">This is an error</li>'
    )
    expect(wrapper.html()).toContain(
      `<li class="formkit-message" id="${id}-this-is-another" data-message-type="error">This is another</li>`
    )
  })

  it('it counts the errors on an input', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        errors: ['This is an error', 'This is another'],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode(id)
    expect(node?.ledger.value('errors')).toBe(2)
    expect(node?.context?.state.errors).toBe(true)
    wrapper.setProps({
      errors: [],
    })
    await nextTick()
    expect(node?.ledger.value('errors')).toBe(0)
    expect(node?.context?.state.errors).toBe(false)
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
    // TODO - Remove the .get() here when @vue/test-utils > rc.19
    expect(wrapper.get('div').findAll('li').length).toBe(1)
  })

  it('automatically clears an input’s errors on input', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        name: 'simple',
        errors: ['Explicit error'],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode(id)!
    node.setErrors(['This is a huge problem!'])
    const outer = wrapper.find('div')
    await nextTick()
    expect(outer.findAll('.formkit-message').length).toBe(2)
    node.input('foo', false)
    await nextTick()
    expect(outer.findAll('.formkit-message').length).toBe(1)
  })

  it('does not clear an input’s errors with preserve-errors prop', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        preserveErrors: true,
        name: 'simple',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode(id)!
    node.setErrors(['This is a huge problem!'])
    await nextTick()
    expect(wrapper.find('.formkit-message').exists()).toBe(true)
    node.input('foo', false)
    await nextTick()
    expect(wrapper.find('.formkit-message').exists()).toBe(true)
  })

  it('can clear all errors of children of a group', async () => {
    const id = token()
    const wrapper = mount(
      {
        methods: {
          handleSubmit(_data: Record<string, any>, node: FormKitNode) {
            node.setErrors(['There were issues with your form'], {
              username: ['This username was already taken'],
            })
          },
        },
        template: `
      <FormKit id="${id}" type="form" @submit="handleSubmit">
        <FormKit name="username" :delay="0" preserve-errors="true" />
      </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 10))
    const form = getNode(id)!
    expect(form.ledger.value('errors')).toBe(2)
    wrapper.find('input').setValue('bar foo')
    await new Promise((r) => setTimeout(r, 25))
    expect(form.ledger.value('errors')).toBe(2)
    form.clearErrors()
    await nextTick()
    expect(form.ledger.value('errors')).toBe(0)
  })

  it('children emit no model update if not v-modeled on boot', async () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'group',
      },
      slots: {
        default() {
          return h(FormKit, {
            name: 'child',
            value: 'foobar',
          })
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const eventWrapper = wrapper.emitted('update:modelValue')
    expect(eventWrapper?.length).toBe(undefined)
  })

  it('does not emit updatedModel if child has ignored prop', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'group',
      },
      slots: {
        default() {
          return h(FormKit, {
            name: 'child',
            value: 'foobar',
            ignore: true,
          })
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.emitted('update:modelValue')).toBe(undefined)
  })

  it('can use regex pseudo props', async () => {
    const wrapper = mount(
      {
        template: `
          <FormKit
            type="form"
            :foo-bar-icon="icon"
            #default="{ fooBarIcon }"
          >
            {{ fooBarIcon }}
          </FormKit>
        `,
        data() {
          return {
            icon: 'avatarMan',
          }
        },
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.html()).toContain('avatarMan')
    wrapper.setData({
      icon: 'avatarWoman',
    })
    await nextTick()
    expect(wrapper.html()).toContain('avatarWoman')
  })
})

describe('id', () => {
  it('automatically generates a unique id', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        name: 'foo',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toEqual(
      expect.stringMatching(/<input.*?id="input_\d+".*?>/)
    )
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

  it('does not perform input events on v-modeled form', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            formData: {} as { username: string; password: string },
          }
        },
        template: `<FormKit type="form" v-model="formData">
          <FormKit type="text" name="username" />
          <FormKit type="text" help="abc" :sections-schema="{ help: { children: '$state.dirty' } }" name="password" />
        </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('.formkit-help').text()).toBe('false')
    wrapper.vm.$data.formData.username = 'foo'
    await nextTick()
    expect(wrapper.find('.formkit-help').text()).toBe('false')
  })

  it('can v-model using undefined refs', async () => {
    const formData = ref<undefined | { username: string }>()
    const wrapper = mount(
      {
        setup() {
          return {
            formData,
          }
        },
        template: `<FormKit type="form" v-model="formData">
          <FormKit type="text" name="username" />
          <FormKit type="text" help="abc" :sections-schema="{ help: { children: '$state.dirty' } }" name="password" />
        </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('.formkit-help').text()).toBe('false')
    formData.value = { username: 'foo' }
    await nextTick()
    expect(wrapper.find('input').element.value).toBe('foo')
  })
})

describe('events', () => {
  it('emits the node as soon as it is created', () => {
    const wrapper = mount(
      {
        template: '<FormKit @node="e => { node = e }" />',
        data() {
          return {
            node: null as null | FormKitNode,
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
        validationVisibility: 'live',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('li.formkit-message').exists()).toBe(true)
  })

  it('can use arbitrarily created validation rules and messages', () => {
    const id = token()
    const wrapper = mount(
      {
        template: `
          <FormKit
            id="${id}"
            label="ABC"
            validation="abc"
            :validation-rules="{
              abc: ({ value }) => value === 'abc'
            }"
            :validation-messages="{
              abc: ({ name }) => name + ' should be abc'
            }"
            validation-visibility="live"
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
      `<li class="formkit-message" id="${id}-rule_abc" data-message-type="validation">ABC should be abc</li>`
    )
  })

  it('can override the validation label', () => {
    const id = token()
    const wrapper = mount(
      {
        template: `
          <FormKit
            id="${id}"
            label="foo"
            :validation="[['required']]"
            validation-label="bar"
            validation-visibility="live"
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
      `<li class="formkit-message" id="${id}-rule_required" data-message-type="validation">Bar is required.</li>`
    )
  })

  it('can change a label used in the error message', async () => {
    const id = token()
    const label = ref('FizBuz')
    const wrapper = mount(
      {
        setup() {
          return { label }
        },
        template: `
          <FormKit
            id="${id}"
            :label="label"
            validation="required"
            validation-visibility="live"
          />
        `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.html()).toContain(`FizBuz is required`)
    label.value = 'Apple Pie'
    await nextTick()
    expect(wrapper.html()).toContain(`Apple Pie is required`)
  })

  it('can override the validation label strategy', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        label: 'foo',
        validation: 'required',
        validationVisibility: 'live',
        validationLabel: (node: FormKitNode) => {
          return node.props.attrs['data-foo']
        },
        'data-foo': 'hi there',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toContain(
      `<li class="formkit-message" id="${id}-rule_required" data-message-type="validation">Hi there is required.</li>`
    )
  })

  it('knows the validation state of a form', async () => {
    const wrapper = mount(
      {
        template: `
        <div>
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
        </div>
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
    // TODO - Remove the .get() here when @vue/test-utils > rc.19
    const [email, name] = wrapper.get('div').findAll('input')
    email.setValue('info@formkit.com')
    name.setValue('Rockefeller')
    await new Promise((r) => setTimeout(r, 40))
    expect(wrapper.find('button').attributes()).not.toHaveProperty('disabled')
  })

  it('knows the state of validation visibility when set to blur', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        type: 'text',
        validation: 'required',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode(id)
    expect(node?.context?.state.validationVisible).toBe(false)
    wrapper.find('input').trigger('blur')
    await nextTick()
    expect(node?.context?.state.validationVisible).toBe(true)
  })

  it('knows the state of validation visibility when set to live', () => {
    const id = token()
    mount(FormKit, {
      props: {
        id,
        type: 'text',
        validation: 'required',
        validationVisibility: 'live',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode(id)
    expect(node?.context?.state.validationVisible).toBe(true)
  })

  it('knows the state of validation visibility when set to dirty', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        type: 'text',
        delay: 0,
        validation: 'required',
        validationVisibility: 'dirty',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode(id)
    expect(node?.context?.state.validationVisible).toBe(false)
    wrapper.find('input').element.value = 'foobar'
    wrapper.find('input').trigger('input')
    await new Promise((r) => setTimeout(r, 10))
    expect(node?.context?.state.validationVisible).toBe(true)
  })

  it('knows the state of validation visibility when set to submit', async () => {
    const id = token()
    const formId = token()
    const wrapper = mount(
      {
        template: `<FormKit type="form" id="${formId}" @submit="() => {}">
          <FormKit
            id="${id}"
            validation="required"
            validation-visibility="submit"
            :delay="0"
          />
        </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    const node = getNode(id)
    expect(node?.context?.state.validationVisible).toBe(false)
    wrapper.find('input').element.value = 'foobar'
    wrapper.find('input').trigger('input')
    wrapper.find('input').trigger('blur')
    await new Promise((r) => setTimeout(r, 10))
    expect(node?.context?.state.validationVisible).toBe(false)
    wrapper.find('form').trigger('submit')
    await nextTick()
    expect(node?.context?.state.validationVisible).toBe(true)
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

  it('does not show validation errors till after the input has settled', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        validation: 'required|length:5',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode(id)
    wrapper.find('input').setValue('abc')
    wrapper.find('input').trigger('input')
    wrapper.find('input').trigger('blur')
    expect(node?.context!.state.settled).toBe(false)
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('.formkit-messages').exists()).toBe(false)
    await new Promise((r) => setTimeout(r, 20))
    expect(wrapper.find('.formkit-messages').exists()).toBe(true)
  })

  it('can show validation immediately', async () => {
    const wrapper = mount(FormKit, {
      props: {
        validation: 'required',
        validationVisibility: 'live',
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
        validationVisibility: 'dirty',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('.formkit-messages').exists()).toBe(false)
    wrapper.find('input').setValue('foo')
    await new Promise((r) => setTimeout(r, 35))
    expect(wrapper.find('.formkit-messages').exists()).toBe(true)
  })

  it('can alter a validation message', async () => {
    const wrapper = mount(FormKit, {
      props: {
        value: 'formkit',
        validation: 'length:10',
        validationVisibility: 'live',
        validationMessages: {
          length: 'Too short',
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toContain('Too short')
  })

  it('changes state.rules when the validation prop changes', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        validation: 'required|length:10',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode(id)
    expect(node?.context?.state.rules).toBe(true)
    wrapper.setProps({ validation: '' })
    await nextTick()
    expect(node?.context?.state.rules).toBe(false)
  })

  it('is complete when the input has validation rules that are passing', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        delay: 0,
        validation: 'required|length:10',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode(id)
    expect(node?.context?.state.complete).toBe(false)
    wrapper.find('input').element.value = 'its not the end yet'
    wrapper.find('input').trigger('input')
    await new Promise((r) => setTimeout(r, 20))
    expect(node?.context?.state.complete).toBe(true)
  })

  it('is complete when it has no validation rules is not dirty', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        delay: 0,
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode(id)
    expect(node?.context?.state.complete).toBe(false)
    wrapper.find('input').element.value = 'yes'
    wrapper.find('input').trigger('input')
    await new Promise((r) => setTimeout(r, 10))
    expect(node?.context?.state.complete).toBe(true)
  })

  it('is not complete when the input has explicit error messages', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        delay: 0,
        validation: 'required',
        errors: ['This is an error'],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const node = getNode(id)
    expect(node?.context?.state.complete).toBe(false)
    wrapper.find('input').element.value = 'yes'
    wrapper.find('input').trigger('input')
    await new Promise((r) => setTimeout(r, 10))
    expect(node?.context?.state.complete).toBe(false)
  })

  it('can dynamically change the validation-visibility', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            visibility: 'blur',
          }
        },
        template: `<FormKit
        validation="required"
        :validation-visibility="visibility"
      />`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('.formkit-messages').exists()).toBe(false)
    wrapper.vm.visibility = 'live'
    await new Promise((r) => setTimeout(r, 20))
    expect(wrapper.find('.formkit-messages').exists()).toBe(true)
  })

  it('does automatically set the validation state to dirty', async () => {
    const firstNode = token()
    mount(
      {
        data() {
          return {
            visibility: 'blur',
          }
        },
        template: `
        <FormKit type="form">
          <FormKit id="${firstNode}"/>
          <FormKit />
        </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    await nextTick()
    expect(getNode(firstNode)?.store.dirty).toBe(undefined)
  })

  it('avoids recursive updates when using state.valid and array computed array rules (#255)', async () => {
    const warning = jest.fn()
    const mock = jest.spyOn(global.console, 'warn').mockImplementation(warning)
    mount(
      {
        setup() {
          const list = [{ url: 'a' }, { url: 'b' }]
          return { list }
        },
        template: `
      <FormKit
        type="form"
        #default="{ state: { valid } }"
      >
        {{ valid }}
        <FormKit
          :validation="[
            ['not', ...list.map(e => e.url)]
          ]"
        />
      </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    await new Promise((r) => setTimeout(r, 500))
    mock.mockRestore()
    expect(warning).not.toHaveBeenCalled()
  })

  it('can use reactive values in validation rules defined with array syntax', async () => {
    const wrapper = mount(
      {
        setup() {
          const list = ref(['a', 'b', 'c'])
          const addD = () => list.value.push('d')
          return { list, addD }
        },
        template: `
      <FormKit
        type="form"
        #default="{ state: { valid } }"
      >
        <FormKit
          value="d"
          :validation="[['is', ...list]]"
        />
        <span class="validity" @click="addD">{{ valid }}</span>
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
    expect(wrapper.find('.validity').text()).toBe('false')
    wrapper.find('.validity').trigger('click')
    await new Promise((r) => setTimeout(r, 20))
    expect(wrapper.find('.validity').text()).toBe('true')
  })

  it('can respond to dynamic validationRules prop', async () => {
    const wrapper = mount(
      {
        setup() {
          const list = ref(['a', 'b', 'c'])
          const foo = (node: FormKitNode) => node.value !== 'foo'
          const rules = ref<Record<string, FormKitValidationRule>>({ foo })
          const addRule = () => {
            rules.value = {
              ...rules.value,
              bar: function (node: FormKitNode) {
                return node.value !== 'bar'
              },
            }
          }
          return { list, rules, addRule }
        },
        template: `
        <FormKit
          :validation-rules="rules"
          validation="foo|bar"
          validation-visibility="live"
          value="bar"
        />
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('.formkit-messages').exists()).toBe(false)
    wrapper.vm.addRule()
    await new Promise((r) => setTimeout(r, 200))
    expect(wrapper.find('.formkit-messages').exists()).toBe(true)
  })
})

describe('configuration', () => {
  it('can change configuration options via prop', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            node1: null as null | FormKitNode,
            node2: null as null | FormKitNode,
            node3: null as null | FormKitNode,
          }
        },
        template: `
        <FormKit
          type="group"
          :config="{
            errorVisibility: 'foobar',
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
              errorVisibility: 'live'
            }"
          >
            <FormKit
              type="text"
              error-visibility="barfoo"
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
    expect(wrapper.vm.$data.node1?.props.errorVisibility).toBe('foobar')
    expect(wrapper.vm.$data.node2?.props.errorVisibility).toBe('barfoo')
    expect(wrapper.vm.$data.node3?.props.errorVisibility).toBe('live')
  })

  it('can change validation rules from vue plugin injected props', () => {
    const wrapper = mount(FormKit, {
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              props: {
                validation: 'required',
                validationVisibility: 'live',
              },
            }),
          ],
        ],
      },
    })
    expect(wrapper.find('.formkit-messages').exists()).toBe(true)
  })

  it('reactively changes the name used in a rendered validation message', async () => {
    const label = ref('foobar')
    const wrapper = mount(
      {
        setup() {
          return { label }
        },
        template: `
        <FormKit
          type="text"
          validation="required"
          validation-visibility="live"
          :label="label"
        />
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('.formkit-message').text()).toBe('Foobar is required.')
    label.value = 'zippydoo'
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('.formkit-message').text()).toBe(
      'Zippydoo is required.'
    )
  })
})

describe('classes', () => {
  it('renders default classes properly', () => {
    const wrapper = mount(FormKit, {
      props: {
        name: 'classTest',
        label: 'input label',
        help: 'input help text',
        id: 'foobar',
        validation: 'required|length:10',
        validationVisibility: 'live',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html())
      .toBe(`<div class="formkit-outer" data-family="text" data-type="text" data-invalid="true">
  <div class="formkit-wrapper"><label class="formkit-label" for="foobar">input label</label>
    <div class="formkit-inner">
      <!---->
      <!----><input class="formkit-input" type="text" name="classTest" id="foobar" aria-describedby="help-foobar foobar-rule_required">
      <!---->
      <!---->
    </div>
  </div>
  <div class="formkit-help" id="help-foobar">input help text</div>
  <ul class="formkit-messages">
    <li class="formkit-message" id="foobar-rule_required" data-message-type="validation">Input label is required.</li>
  </ul>
</div>`)
  })

  it('can apply new classes from strings', () => {
    const wrapper = mount(FormKit, {
      props: {
        name: 'classTest',
        classes: {
          outer: 'test-class-string1',
        },
        outerClass: 'test-class-string2',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('.formkit-outer').html()).toContain(
      'class="formkit-outer test-class-string1 test-class-string2'
    )
  })

  it('can can remove existing classes if class name string is prefixed with a ! operator', () => {
    const wrapper = mount(FormKit, {
      props: {
        name: 'classTest',
        classes: {
          outer: '!formkit-outer test-class-string1',
        },
        outerClass: '!test-class-string1 should-be-only-me',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('[data-type="text"]').html()).toContain(
      'class="should-be-only-me'
    )
  })

  it('can apply new classes from functions', () => {
    const wrapper = mount(FormKit, {
      props: {
        name: 'classTest',
        classes: {
          outer: (node: any) => {
            return node.name === 'classTest' ? 'test-class-function1' : ''
          },
        },
        outerClass: (node: any) => {
          return node.name === 'foobar' ? '' : 'test-class-function2'
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('.formkit-outer').html()).toContain(
      'class="formkit-outer test-class-function1 test-class-function2'
    )
  })

  it('can apply new classes from class objects', () => {
    const wrapper = mount(FormKit, {
      props: {
        name: 'classTest',
        classes: {
          outer: {
            'test-class-object1': true,
            'ignore-me1': false,
          },
        },
        outerClass: {
          'ignore-me2': false,
          'test-class-object2': true,
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('.formkit-outer').html()).toContain(
      'class="formkit-outer test-class-object1 test-class-object2'
    )
  })

  it('allows a class list to be reset from each level of specificity', async () => {
    const wrapper = mount(FormKit, {
      props: {
        name: 'classTest',
        inputClass: '',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('input').html()).toContain('class="formkit-input')
    wrapper.setProps({
      classes: {
        input: '$reset input-class-from-classes-object',
      },
    })
    await nextTick()
    expect(wrapper.find('input').html()).toContain(
      'class="input-class-from-classes-object'
    )
    expect(wrapper.find('input').html()).not.toContain('formkit-input')
    wrapper.setProps({
      inputClass: '$reset input-class-from-input-class-prop',
    })
    await nextTick()
    expect(wrapper.find('input').html()).toContain(
      'class="input-class-from-input-class-prop'
    )
    expect(wrapper.find('input').html()).not.toContain(
      'input-class-from-classes-object'
    )
    wrapper.setProps({
      classes: {
        input: 'input-class-from-classes-object',
      },
      inputClass: 'input-class-from-input-class-prop',
    })
    await nextTick()
    expect(wrapper.find('input').html()).toContain(
      'class="formkit-input input-class-from-classes-object input-class-from-input-class-prop'
    )
  })

  it('allows classes to be over-ridden with a default config', () => {
    const wrapper = mount(FormKit, {
      props: {
        name: 'classTest',
        label: 'Howdy folks',
        id: 'foo',
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              config: {
                classes: {
                  label: 'foo-bar',
                },
              },
            }),
          ],
        ],
      },
    })
    expect(wrapper.html()).toContain(
      '<label class="formkit-label foo-bar" for="foo">Howdy folks</label>'
    )
  })

  it('allows classes to be replaced with rootClasses function', () => {
    const wrapper = mount(FormKit, {
      props: {
        name: 'classTest',
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              config: {
                rootClasses: (key) => ({ [`foo-${key}`]: true }),
              },
            }),
          ],
        ],
      },
    })
    expect(wrapper.html()).toContain('class="foo-outer"')
  })

  it('does not throw errors if rootClasses returns undefined', () => {
    expect(() =>
      mount(FormKit, {
        props: {
          name: 'classTest',
        },
        global: {
          plugins: [
            [
              plugin,
              defaultConfig({
                config: {
                  rootClasses: () => undefined as any,
                },
              }),
            ],
          ],
        },
      })
    ).not.toThrow()
  })

  it('reacts to an updated classes prop', async () => {
    const wrapper = mount(
      {
        setup() {
          const border = ref(false)
          const classes = reactive({
            inner: {
              'my-class': border,
            },
          })
          function changeBorder() {
            border.value = true
          }
          return { classes, changeBorder }
        },
        template: `
        <FormKit
        type="text"
        label="invalid"
        :classes="classes"
      />
      <button @click="changeBorder">Change Border</button>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('.formkit-inner').attributes('class')).toBe(
      'formkit-inner'
    )
    wrapper.find('button').trigger('click')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('.formkit-inner').attributes('class')).toBe(
      'formkit-inner my-class'
    )
  })

  it('respects the delay prop', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            group: { foo: 'bar' },
          }
        },
        template: `<FormKit type="group" v-model="group"><FormKit type="text" name="foo" :delay="80" /></FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    const val = token()
    wrapper.find('input[type="text"]').setValue(val)
    wrapper.find('input[type="text"]').trigger('input')
    await new Promise((r) => setTimeout(r, 50))
    expect(wrapper.vm.group).toStrictEqual({ foo: 'bar' })
    await new Promise((r) => setTimeout(r, 35))
    expect(wrapper.vm.group).toStrictEqual({ foo: val })
  })
})

describe('plugins', () => {
  it('can apply a new plugin as a prop', () => {
    const wrapper = mount(FormKit, {
      props: {
        plugins: [
          (node: FormKitNode) => {
            node.props.help = 'This plugin added help text!'
            return false
          },
        ],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toContain('This plugin added help text!')
  })

  it('produces a custom input using a plugin', () => {
    const customInput = () => {}
    customInput.library = function (node: FormKitNode) {
      node.define({
        type: 'input',
        schema: [
          { $el: 'input', attrs: { class: 'gbr', ['data-source']: '$bar' } },
        ],
        props: ['bar'],
        features: [
          (node) =>
            node.hook.prop((prop, next) => {
              if (prop.prop === 'bar') {
                prop.value = 'hello world'
              }
              return next(prop)
            }),
        ],
      })
    }
    const wrapper = mount(FormKit, {
      attrs: {
        bar: 'foobar',
      },
      global: {
        plugins: [[plugin, { plugins: [vuePlugin, customInput] }]],
      },
    })
    expect(wrapper.html()).toBe('<input class="gbr" data-source="hello world">')
  })
})

describe('icons', () => {
  it('can add prefix and suffix icons', () => {
    const wrapper = mount(FormKit, {
      props: {
        prefixIcon: 'heart',
        suffixIcon: 'settings',
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              icons: {
                heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 16"><path d="M7.5,14c-.2,0-.4-.08-.56-.23-1.06-1.04-4.58-4.59-5.49-6.34-.63-1.2-.59-2.7,.09-3.83,.61-1.01,1.67-1.59,2.9-1.59,1.56,0,2.53,.81,3.06,1.63,.53-.82,1.5-1.63,3.06-1.63,1.23,0,2.29,.58,2.9,1.59,.68,1.13,.72,2.63,.09,3.83-.92,1.76-4.43,5.3-5.49,6.34-.16,.16-.36,.23-.56,.23ZM4.44,3c-.88,0-1.61,.39-2.04,1.11-.51,.83-.53,1.95-.06,2.85,.66,1.26,3.07,3.88,5.17,5.96,2.09-2.08,4.51-4.69,5.17-5.96,.47-.9,.44-2.02-.06-2.85-.43-.72-1.16-1.11-2.04-1.11-2.12,0-2.55,1.9-2.57,1.98h-.98c-.02-.08-.47-1.98-2.57-1.98Z" fill="currentColor"/></svg>`,
                settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,10.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5,2.5,1.12,2.5,2.5-1.12,2.5-2.5,2.5Zm0-4c-.83,0-1.5,.67-1.5,1.5s.67,1.5,1.5,1.5,1.5-.67,1.5-1.5-.67-1.5-1.5-1.5Z" fill="currentColor"/><path d="M8.85,15h-1.7c-.32,0-.6-.22-.67-.53l-.41-1.79-1.56,.98c-.27,.17-.62,.13-.85-.1l-1.2-1.2c-.23-.23-.27-.58-.1-.85l.98-1.56-1.79-.41c-.31-.07-.53-.35-.53-.67v-1.7c0-.32,.22-.6,.53-.67l1.79-.41-.98-1.56c-.17-.27-.13-.62,.1-.85l1.2-1.2c.23-.23,.58-.27,.85-.1l1.56,.98,.41-1.79c.07-.31,.35-.53,.67-.53h1.7c.32,0,.6,.22,.67,.53l.41,1.79,1.56-.98c.27-.17,.62-.13,.85,.1l1.2,1.2c.23,.23,.27,.58,.1,.85l-.98,1.56,1.79,.41c.31,.07,.53,.35,.53,.67v1.7c0,.32-.22,.6-.53,.67l-1.79,.41,.98,1.56c.17,.27,.13,.62-.1,.85l-1.2,1.2c-.23,.23-.58,.27-.85,.1l-1.56-.98-.41,1.79c-.07,.31-.35,.53-.67,.53Zm-1.45-1h1.2l.67-2.92,2.54,1.59,.85-.85-1.59-2.54,2.92-.67v-1.2l-2.92-.67,1.59-2.54-.85-.85-2.54,1.59-.67-2.92h-1.2l-.67,2.92-2.54-1.59-.85,.85,1.59,2.54-2.92,.67v1.2l2.92,.67-1.59,2.54,.85,.85,2.54-1.59,.67,2.92Zm6.84-6.55h0Z" fill="currentColor"/></svg>`,
              },
            }),
          ],
        ],
      },
    })
    expect(wrapper.html()).toContain(
      `<label class=\"formkit-prefix-icon formkit-icon\"`
    )
    expect(wrapper.html()).toContain(
      `<span class="formkit-suffix-icon formkit-icon">`
    )
  })

  it('adds data attributes for prefix and suffix icons', () => {
    const wrapper = mount(FormKit, {
      props: {
        prefixIcon: 'heart',
        suffixIcon: 'settings',
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              icons: {
                heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 16"><path d="M7.5,14c-.2,0-.4-.08-.56-.23-1.06-1.04-4.58-4.59-5.49-6.34-.63-1.2-.59-2.7,.09-3.83,.61-1.01,1.67-1.59,2.9-1.59,1.56,0,2.53,.81,3.06,1.63,.53-.82,1.5-1.63,3.06-1.63,1.23,0,2.29,.58,2.9,1.59,.68,1.13,.72,2.63,.09,3.83-.92,1.76-4.43,5.3-5.49,6.34-.16,.16-.36,.23-.56,.23ZM4.44,3c-.88,0-1.61,.39-2.04,1.11-.51,.83-.53,1.95-.06,2.85,.66,1.26,3.07,3.88,5.17,5.96,2.09-2.08,4.51-4.69,5.17-5.96,.47-.9,.44-2.02-.06-2.85-.43-.72-1.16-1.11-2.04-1.11-2.12,0-2.55,1.9-2.57,1.98h-.98c-.02-.08-.47-1.98-2.57-1.98Z" fill="currentColor"/></svg>`,
                settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8,10.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5,2.5,1.12,2.5,2.5-1.12,2.5-2.5,2.5Zm0-4c-.83,0-1.5,.67-1.5,1.5s.67,1.5,1.5,1.5,1.5-.67,1.5-1.5-.67-1.5-1.5-1.5Z" fill="currentColor"/><path d="M8.85,15h-1.7c-.32,0-.6-.22-.67-.53l-.41-1.79-1.56,.98c-.27,.17-.62,.13-.85-.1l-1.2-1.2c-.23-.23-.27-.58-.1-.85l.98-1.56-1.79-.41c-.31-.07-.53-.35-.53-.67v-1.7c0-.32,.22-.6,.53-.67l1.79-.41-.98-1.56c-.17-.27-.13-.62,.1-.85l1.2-1.2c.23-.23,.58-.27,.85-.1l1.56,.98,.41-1.79c.07-.31,.35-.53,.67-.53h1.7c.32,0,.6,.22,.67,.53l.41,1.79,1.56-.98c.27-.17,.62-.13,.85,.1l1.2,1.2c.23,.23,.27,.58,.1,.85l-.98,1.56,1.79,.41c.31,.07,.53,.35,.53,.67v1.7c0,.32-.22,.6-.53,.67l-1.79,.41,.98,1.56c.17,.27,.13,.62-.1,.85l-1.2,1.2c-.23,.23-.58,.27-.85,.1l-1.56-.98-.41,1.79c-.07,.31-.35,.53-.67,.53Zm-1.45-1h1.2l.67-2.92,2.54,1.59,.85-.85-1.59-2.54,2.92-.67v-1.2l-2.92-.67,1.59-2.54-.85-.85-2.54,1.59-.67-2.92h-1.2l-.67,2.92-2.54-1.59-.85,.85,1.59,2.54-2.92,.67v1.2l2.92,.67-1.59,2.54,.85,.85,2.54-1.59,.67,2.92Zm6.84-6.55h0Z" fill="currentColor"/></svg>`,
              },
            }),
          ],
        ],
      },
    })
    expect(wrapper.html()).toContain(`data-prefix-icon=\"true\"`)
    expect(wrapper.html()).toContain(`data-suffix-icon=\"true\"`)
  })

  it('can register click handlers on icons', async () => {
    const iconClick = jest.fn()
    const wrapper = mount(FormKit, {
      props: {
        prefixIcon: 'heart',
        onPrefixIconClick: iconClick,
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              icons: {
                heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 16"><path d="M7.5,14c-.2,0-.4-.08-.56-.23-1.06-1.04-4.58-4.59-5.49-6.34-.63-1.2-.59-2.7,.09-3.83,.61-1.01,1.67-1.59,2.9-1.59,1.56,0,2.53,.81,3.06,1.63,.53-.82,1.5-1.63,3.06-1.63,1.23,0,2.29,.58,2.9,1.59,.68,1.13,.72,2.63,.09,3.83-.92,1.76-4.43,5.3-5.49,6.34-.16,.16-.36,.23-.56,.23ZM4.44,3c-.88,0-1.61,.39-2.04,1.11-.51,.83-.53,1.95-.06,2.85,.66,1.26,3.07,3.88,5.17,5.96,2.09-2.08,4.51-4.69,5.17-5.96,.47-.9,.44-2.02-.06-2.85-.43-.72-1.16-1.11-2.04-1.11-2.12,0-2.55,1.9-2.57,1.98h-.98c-.02-.08-.47-1.98-2.57-1.98Z" fill="currentColor"/></svg>`,
              },
            }),
          ],
        ],
      },
    })
    wrapper.find('.formkit-prefix-icon').trigger('click')
    await new Promise((r) => setTimeout(r, 10))
    expect(iconClick).toHaveBeenCalledTimes(1)
  })
})

describe('prefix and suffix', () => {
  it('supports prefix and suffix on text based inputs', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'password',
        name: 'table_stakes',
        id: 'pass',
        sectionsSchema: { prefix: 'Hush', suffix: 'Show' },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('.formkit-inner').html()).toBe(
      `<div class="formkit-inner">
  <!---->Hush<input class="formkit-input" type="password" name="table_stakes" id="pass">Show
  <!---->
</div>`
    )
  })

  it('supports prefix/suffix on box-type inputs', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'checkbox',
        name: 'terms',
        id: 'terms',
        sectionsSchema: { prefix: 'Prefix', suffix: 'Suffix' },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('.formkit-inner').html()).toBe(
      '<div class="formkit-inner">Prefix<input class="formkit-input" type="checkbox" name="terms" id="terms" value="true"><span class="formkit-decorator" aria-hidden="true"><!----></span>Suffix</div>'
    )
  })

  it('supports prefix/suffix on button inputs', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'button',
        label: 'Button',
        sectionsSchema: { prefix: 'Prefix', suffix: 'Suffix' },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('button').text()).toBe('PrefixButtonSuffix')
  })

  it('supports prefix/suffix on select inputs', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'select',
        id: 'alpha',
        name: 'alpha',
        options: ['A', 'B'],
        sectionsSchema: { prefix: 'Prefix', suffix: 'Suffix' },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('.formkit-inner').html()).toBe(
      `<div class="formkit-inner">
  <!---->Prefix<select class="formkit-input" id="alpha" name="alpha">
    <option class="formkit-option" value="A">A</option>
    <option class="formkit-option" value="B">B</option>
  </select>
  <!---->Suffix
  <!---->
</div>`
    )
  })
})

describe('state attributes', () => {
  it('does not initialize with the complete attribute', async () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        delay: 0,
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const input = wrapper.find('input')
    expect(wrapper.find('.formkit-outer').attributes('data-complete')).toBe(
      undefined
    )
    input.element.value = '123'
    input.trigger('input')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('.formkit-outer').attributes('data-complete')).toBe(
      'true'
    )
    input.element.value = ''
    input.trigger('input')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('.formkit-outer').attributes('data-complete')).toBe(
      undefined
    )
  })

  it('adds the data-complete attribute when it passes validation', async () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        delay: 0,
        validation: 'required|length:5',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const input = wrapper.find('input')
    expect(wrapper.find('.formkit-outer').attributes('data-complete')).toBe(
      undefined
    )
    input.element.value = '123'
    input.trigger('input')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('.formkit-outer').attributes('data-complete')).toBe(
      undefined
    )
    input.element.value = '123456'
    input.trigger('input')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('.formkit-outer').attributes('data-complete')).toBe(
      'true'
    )
    input.element.value = '126'
    input.trigger('input')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('.formkit-outer').attributes('data-complete')).toBe(
      undefined
    )
  })

  it('adds data-invalid when validation is failing and visible', async () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        delay: 0,
        validation: 'required|length:5',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const input = wrapper.find('input')
    const outer = wrapper.find('.formkit-outer')
    expect(outer.attributes('data-invalid')).toBe(undefined)
    input.trigger('blur')
    await nextTick()
    expect(outer.attributes('data-invalid')).toBe('true')
    input.element.value = '123456'
    input.trigger('input')
    await new Promise((r) => setTimeout(r, 15))
    expect(outer.attributes('data-invalid')).toBe(undefined)
  })

  it('adds data-errors when the input has errors directly applied via prop', async () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        delay: 0,
        validation: 'required|length:5',
        errors: ['This is an error'],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const outer = wrapper.find('.formkit-outer')
    expect(outer.attributes('data-errors')).toBe('true')
    wrapper.setProps({ errors: [] })
    await nextTick()
    expect(outer.attributes('data-errors')).toBe(undefined)
  })

  it('adds data-errors when the input has errors applied via form', async () => {
    const formId = token()
    const wrapper = mount(
      {
        template: `<FormKit type="form" id="${formId}">
        <FormKit
          type="text"
          name="foo"
          :delay="0"
        />
      </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    setErrors(formId, [], {
      foo: ['this is an error'],
    })
    await nextTick()
    const outer = wrapper.find('.formkit-outer')
    expect(outer.attributes('data-errors')).toBe('true')
    setErrors(formId, [], { foo: [] })
    await nextTick()
    expect(outer.attributes('data-errors')).toBe(undefined)
  })

  it('adds data-disabled when the input is disabled', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        delay: 0,
        disabled: true,
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const outer = wrapper.find('.formkit-outer')
    expect(outer.attributes('data-disabled')).toBe('true')
  })

  it('does not add data-disabled when the input’s disabled prop is false', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'checkbox',
        delay: 0,
        disabled: false,
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    const outer = wrapper.find('.formkit-outer')
    expect(outer.html()).not.toContain('data-disabled')
  })
})

describe('exposures', () => {
  it('exposes the core FormKitNode', () => {
    const wrapper = mount(
      {
        template: '<FormKit type="select" ref="select" />',
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    const node = (wrapper.vm.$refs.select as any).node as FormKitNode
    expect(node.props.type).toBe('select')
    expect(node.__FKNode__).toBe(true)
  })

  it('allows artificial parent injection', () => {
    const node = createNode({
      type: 'group',
      name: 'foobar',
      value: { job: 'engineer' },
    })
    const wrapper = mount(
      {
        setup() {
          return { parent: node }
        },
        template: '<FormKit name="job" :parent="parent" />',
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('input').element.value).toBe('engineer')
  })

  it('emits the HTML event that triggered the input', () => {
    const id = token()
    const wrapper = mount(
      {
        template: `<FormKit id="${id}" />`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    const node = getNode(id)
    const callback = jest.fn()
    node?.on('dom-input-event', callback)
    wrapper.find('input').setValue('foo bar')
    expect(callback).toHaveBeenCalledTimes(1)
    expect((callback.mock.calls[0][0] as FormKitEvent).payload).toBeInstanceOf(
      Event
    )
  })

  it('debounces the input event and not the inputRaw event', async () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'group',
      },
      slots: {
        default() {
          return [
            h(FormKit, {
              name: 'child',
              value: 'foobar',
            }),
            h(FormKit, {
              name: 'child2',
              value: 'barfoo',
            }),
          ]
        },
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    await new Promise((r) => setTimeout(r, 50))
    expect(wrapper.emitted('inputRaw')!.length).toBe(5)
    expect(wrapper.emitted('input')!.length).toBe(1)
  })

  it('can set values on a group with values that dont have correlating nodes', async () => {
    const groupId = token()
    const wrapper = mount(
      {
        data() {
          return {
            groupValue: { a: 'bar' } as any,
          }
        },
        template: `<FormKit type="group" v-model="groupValue" id="${groupId}">
        <FormKit name="a" value="foo" />
      </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )

    expect(wrapper.vm.groupValue).toStrictEqual({ a: 'bar' })
    wrapper.vm.groupValue.b = 'foo'
    await nextTick()
    expect(getNode(groupId)!.value).toStrictEqual({ a: 'bar', b: 'foo' })
  })
})

describe('schema changed', () => {
  it('can change an inputs entire schema and force a re-render', async () => {
    const id = token()
    const wrapper = mount(
      {
        methods: {
          swapSchema() {
            const node = getNode(id)
            if (node) {
              node.props.definition!.schema = () => {
                return [
                  {
                    $el: 'h1',
                    attrs: {
                      id: 'new-schema',
                    },
                    children: 'changed schema',
                  },
                ]
              }
              node.emit('schema')
            }
          },
        },
        template: `<FormKit id="${id}" />`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('input').exists()).toBe(true)
    wrapper.vm.swapSchema()
    await nextTick()
    expect(wrapper.html()).toBe('<h1 id="new-schema">changed schema</h1>')
  })

  it('can use a dynamic default slot. #489', async () => {
    const wrapper = mount(
      {
        components: {
          FormKit,
        },
        setup() {
          const first = ref('yes')
          return { first }
        },
        template: `
        <FormKit type="text">
          <template v-if="first === 'yes'" #label><h1>click me</h1></template>
          <template v-else #label><h2>otherwise click me</h2></template>
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.html()).toContain('<h1>click me</h1>')
    wrapper.vm.first = 'no'
    await nextTick()
    expect(wrapper.html()).toContain('<h2>otherwise click me</h2>')
  })

  it('can use a conditional default slot. #489', async () => {
    const wrapper = mount(
      {
        components: {
          FormKit,
        },
        setup() {
          const first = ref('yes')
          return { first }
        },
        template: `
        <FormKit type="text" label="default">
          <template v-if="first === 'yes'" #label><h1>click me</h1></template>
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.html()).toContain('<h1>click me</h1>')
    wrapper.vm.first = 'no'
    await nextTick()
    expect(wrapper.find('.formkit-label').exists()).toBe(true)
    wrapper.vm.first = 'yes'
    await nextTick()
    expect(wrapper.html()).toContain('<h1>click me</h1>')
  })

  it('can use a conditional default slot that starts as false. #489', async () => {
    const wrapper = mount(
      {
        components: {
          FormKit,
        },
        setup() {
          const first = ref('no')
          return { first }
        },
        template: `
        <FormKit type="text" label="default">
          <template v-if="first === 'yes'" #label><h1>click me</h1></template>
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('.formkit-label').exists()).toBe(true)
    wrapper.vm.first = 'yes'
    await nextTick()
    expect(wrapper.html()).toContain('<h1>click me</h1>')
    expect(wrapper.find('.formkit-label').exists()).toBe(false)
    wrapper.vm.first = 'no'
    await nextTick()
    expect(wrapper.find('.formkit-label').exists()).toBe(true)
    expect(wrapper.html()).not.toContain('<h1>click me</h1>')
  })
})
