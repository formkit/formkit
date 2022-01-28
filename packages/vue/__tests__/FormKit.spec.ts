import { nextTick, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { FormKitNode } from '@formkit/core'
import { token } from '@formkit/utils'
import vuePlugin from '../src/bindings'

// Object.assign(defaultConfig.nodeOptions, { validationVisibility: 'live' })

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

  it('children emit a model update event on boot', () => {
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
    expect(eventWrapper?.length).toBe(1)
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
      '<li class="formkit-message">Bar is required.</li>'
    )
  })

  it('can override the validation label strategy', async () => {
    const wrapper = mount(FormKit, {
      props: {
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
    await new Promise((r) => setTimeout(r, 40))
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
    await new Promise((r) => setTimeout(r, 30))
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
    expect(wrapper.html()).toBe(`<div class="formkit-outer" data-type="text">
  <div class="formkit-wrapper"><label for="foobar" class="formkit-label">input label</label>
    <div class="formkit-inner">
      <!----><input type="text" class="formkit-input" name="classTest" id="foobar">
      <!---->
    </div>
  </div>
  <div id="help-foobar" class="formkit-help">input help text</div>
  <ul class="formkit-messages">
    <li class="formkit-message">Input label is required.</li>
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
      '<div class="formkit-inner">Prefix<select class="formkit-input" name="alpha"><option class="formkit-option" value="A">A</option><option class="formkit-option" value="B">B</option></select>Suffix</div>'
    )
  })
})
