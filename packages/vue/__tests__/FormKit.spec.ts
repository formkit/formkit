import { nextTick, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { FormKitNode, setErrors } from '@formkit/core'
import { token } from '@formkit/utils'
import { getNode, createNode } from '@formkit/core'
import vuePlugin from '../src/bindings'

// Object.assign(defaultConfig.nodeOptions, { validationVisibility: 'live' })

describe('props', () => {
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

  it('children emit a model update event on boot', async () => {
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
    expect(eventWrapper?.length).toBe(2)
    expect(eventWrapper![0]).toEqual([{ child: 'foobar' }])
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
      .toBe(`<div class="formkit-outer" data-type="text" data-invalid="true">
  <div class="formkit-wrapper"><label for="foobar" class="formkit-label">input label</label>
    <div class="formkit-inner">
      <!----><input type="text" class="formkit-input" name="classTest" id="foobar" aria-describedby="help-foobar foobar-rule_required">
      <!---->
    </div>
  </div>
  <div id="help-foobar" class="formkit-help">input help text</div>
  <ul class="formkit-messages" aria-live="polite">
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
      '<label for="foo" class="formkit-label foo-bar">Howdy folks</label>'
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
      '<div class="formkit-inner">Hush<input type="password" class="formkit-input" name="table_stakes" id="pass">Show</div>'
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
      '<div class="formkit-inner">Prefix<input type="checkbox" class="formkit-input" name="terms" id="terms" value="true"><span class="formkit-decorator" aria-hidden="true"></span>Suffix</div>'
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
      `<div class="formkit-inner">Prefix<select id="alpha" class="formkit-input" name="alpha">
    <option class="formkit-option" value="A">A</option>
    <option class="formkit-option" value="B">B</option>
  </select>Suffix</div>`
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
})
