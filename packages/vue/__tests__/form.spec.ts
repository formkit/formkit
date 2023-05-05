import FormKit from '../src/FormKit'
import { FormKitMessages } from '../src/FormKitMessages'
import { plugin, FormKitVuePlugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { getNode, setErrors, FormKitNode, reset } from '@formkit/core'
import { de, en } from '@formkit/i18n'
import { token } from '@formkit/utils'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref, reactive, h, nextTick } from 'vue'

const global: Record<string, Record<string, any>> = {
  global: {
    plugins: [[plugin, defaultConfig]],
  },
}

/**
 * For some reason this is necessary for the tests to be aware of the $formkit
 * plugin. This is not the case, however, when using the plugin in a real
 * application. This change was needed after:
 * https://github.com/formkit/formkit/pull/581
 */
declare module 'vue' {
  interface ComponentCustomProperties {
    $formkit: FormKitVuePlugin
  }
}

describe('form structure', () => {
  it('renders a form with a button', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'form',
        name: 'test_form',
        id: 'foo',
        submitAttrs: {
          id: 'button',
        },
      },
      slots: {
        default: () => h('h1', 'in the form'),
      },
      ...global,
    })
    expect(wrapper.html())
      .toEqual(`<form class="formkit-form" id="foo" name="test_form">
  <h1>in the form</h1>
  <!---->
  <div class="formkit-actions">
    <div class="formkit-outer" data-family="button" data-type="submit">
      <!---->
      <div class="formkit-wrapper"><button class="formkit-input" type="submit" name="submit_1" id="button">
          <!---->
          <!---->Submit
          <!---->
          <!---->
        </button></div>
      <!---->
    </div>
  </div>
</form>`)
  })

  it('outputs the id of the form', () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        type: 'form',
        id,
      },
      ...global,
    })
    expect(wrapper.find('form').attributes('id')).toBe(id)
  })
})

describe('value propagation', () => {
  it('can set the state of checkboxes from a v-model on the form', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            options: ['a', 'b', 'c'],
            values: {
              boxes: [] as string[],
            },
          }
        },
        template: `<FormKit type="form" v-model="values">
        <FormKit type="checkbox" name="boxes" :options="options" />
      </FormKit>`,
      },
      {
        ...global,
      }
    )
    await new Promise((r) => setTimeout(r, 5))
    // TODO - Remove the .get() here when @vue/test-utils > rc.19
    const inputs = wrapper.get('form').findAll('input')
    expect(inputs.length).toBe(3)
    expect(
      inputs.map((input) => (input.element as HTMLInputElement).checked)
    ).toStrictEqual([false, false, false])
    wrapper.vm.values.boxes = ['a', 'b', 'c']
    await new Promise((r) => setTimeout(r, 50))
    expect(
      inputs.map((input) => (input.element as HTMLInputElement).checked)
    ).toStrictEqual([true, true, true])
    expect(wrapper.vm.values.boxes).toStrictEqual(['a', 'b', 'c'])
  })

  it('can set the state of checkboxes from a v-model using vue ref object', async () => {
    const wrapper = mount(
      {
        setup() {
          const options = ['a', 'b', 'c']
          const values = ref({ boxes: [] as string[] })
          const changeValues = () => {
            values.value.boxes = ['a', 'c']
          }
          return { options, values, changeValues }
        },
        template: `<FormKit type="form" v-model="values">
        <FormKit type="checkbox" name="boxes" :options="options" />
        <button type="button" @click="changeValues">Change</button>
      </FormKit>`,
      },
      {
        ...global,
      }
    )
    // TODO - Remove the .get() here when @vue/test-utils > rc.19
    const inputs = wrapper.get('form').findAll('input[type="checkbox"]')
    expect(inputs.length).toBe(3)
    expect(
      inputs.map((input) => (input.element as HTMLInputElement).checked)
    ).toStrictEqual([false, false, false])
    wrapper.find('button[type="button"').trigger('click')
    await nextTick()
    expect(
      inputs.map((input) => (input.element as HTMLInputElement).checked)
    ).toStrictEqual([true, false, true])
  })

  it('can set the state of text input from a v-model using vue reactive object', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(
      {
        setup() {
          const values = reactive<{ form: Record<string, any> }>({
            form: { abc: '123' },
          })
          const changeValues = async () => {
            values.form.foo = 'bar bar'
          }
          return { values, changeValues }
        },
        template: `<FormKit type="form" v-model="values.form">
        <FormKit type="text" name="foo" value="foo" />
        <button type="button" @click="changeValues">Change</button>
      </FormKit>`,
      },
      {
        ...global,
      }
    )
    // TODO - Remove the .get() here when @vue/test-utils > rc.19
    const inputs = wrapper.get('form').findAll('input[type="text"]')
    expect(inputs.length).toBe(1)
    expect(wrapper.find('input').element.value).toEqual('foo')
    // await new Promise((r) => setTimeout(r, 20))
    wrapper.find('button[type="button"]').trigger('click')
    await new Promise((r) => setTimeout(r, 50))
    expect(wrapper.find('input').element.value).toStrictEqual('bar bar')
    warn.mockRestore()
  })
})

describe('form submission', () => {
  it('wont submit the form when it has errors', async () => {
    const submitHandler = vi.fn()
    const wrapper = mount(
      {
        methods: {
          submitHandler,
        },
        template: `<FormKit type="form" @submit="submitHandler">
        <FormKit validation="required|email" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await nextTick()
    expect(submitHandler).not.toHaveBeenCalled()
  })

  it('will call the submit handler when the form has no errors', async () => {
    const submitHandler = vi.fn()
    const wrapper = mount(
      {
        methods: {
          submitHandler,
        },
        template: `<FormKit type="form" @submit="submitHandler">
        <FormKit validation="required|email" value="foo@bar.com" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await nextTick()
    expect(submitHandler).toHaveBeenCalledTimes(1)
  })

  it('sets submitted state when form is submitted', async () => {
    const submitHandler = vi.fn()
    const wrapper = mount(
      {
        methods: {
          submitHandler,
        },
        template: `<FormKit type="form" id="form" @submit="submitHandler">
        <FormKit id="email" validation="required|email" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 5))
    const node = getNode('email')
    const form = getNode('form')
    expect(node?.context?.state?.submitted).toBe(true)
    expect(form?.context?.state?.submitted).toBe(true)
    expect(wrapper.find('.formkit-message').exists()).toBe(true)
  })

  it('fires a submit-raw event even with validation errors', async () => {
    const submitHandler = vi.fn()
    const rawHandler = vi.fn()
    const wrapper = mount(
      {
        methods: {
          submitHandler,
          rawHandler,
        },
        template: `<FormKit type="form" id="login" @submit-raw="rawHandler" @submit="submitHandler">
        <FormKit validation="required|email" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 5))
    expect(submitHandler).not.toHaveBeenCalled()
    expect(rawHandler).toHaveBeenCalledTimes(1)
  })

  it('clears blocking messages if an input is removed', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            showEmail: true,
          }
        },
        template: `<FormKit type="form" #default="{ state }">
        <FormKit v-if="showEmail" validation="required|email" />
        <FormKit type="checkbox" />
        <pre>{{ state.valid }}</pre>
      </FormKit>`,
      },
      global
    )
    await nextTick()
    expect(wrapper.find('pre').text()).toBe('false')
    wrapper.vm.showEmail = false
    await nextTick()
    expect(wrapper.find('pre').text()).toBe('true')
  })

  it('sets a loading state if handler is async', async () => {
    const submitHandler = vi.fn(() => {
      return new Promise((r) => setTimeout(r, 20))
    })
    const wrapper = mount(
      {
        methods: {
          submitHandler,
        },
        template: `<FormKit type="form" id="form" @submit="submitHandler">
        <FormKit name="email" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 5))
    const node = getNode('form')
    expect(node?.context?.state?.loading).toBe(true)
    await new Promise((r) => setTimeout(r, 25))
    expect(node?.context?.state?.loading).toBe(undefined)
  })

  it('does not register the submit button', () => {
    const wrapper = mount(
      {
        methods: {
          submitHandler: () => undefined,
        },
        template: `<FormKit type="form" id="submitButtonForm" @submit="submitHandler">
        <FormKit validation="email" name="email" value="foo@bar.com" />
        <FormKit validation="required" name="country" value="de" :options="{ us: 'usa', de: 'germany' }" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    const node = getNode('submitButtonForm')
    expect(node?.value).toStrictEqual({ email: 'foo@bar.com', country: 'de' })
  })

  it('allows adding an attribute to submit button', () => {
    const wrapper = mount(
      {
        methods: {
          submitHandler: () => undefined,
        },
        template: `<FormKit
          type="form"
          id="submitButtonForm"
          @submit="submitHandler"
          :submit-attrs="{ 'data-foo': 'bar bar' }"
        >
          Content
        </FormKit>`,
      },
      global
    )
    expect(wrapper.find('button[data-foo="bar bar"]').exists()).toBe(true)
  })

  it('can disable all inputs in a form', () => {
    const wrapper = mount(
      {
        template: `<FormKit
          type="form"
          disabled
        >
          <FormKit id="disabledEmail" type="email" />
          <FormKit id="disabledSelect" type="select" />
        </FormKit>`,
      },
      global
    )
    expect(wrapper.find('[data-disabled] input[disabled]').exists()).toBe(true)
    expect(wrapper.find('[data-disabled] select[disabled]').exists()).toBe(true)
  })

  it('can reactively disable and enable all inputs in a form', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            disabled: false,
          }
        },
        template: `<FormKit
          type="form"
          :disabled="disabled"
        >
          <FormKit id="disabledEmail" type="email" />
          <FormKit id="disabledSelect" type="select" />
        </FormKit>`,
      },
      global
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

  it('can disable submit button in a form with only the presence of the disabled attribute (#215)', () => {
    const id = token()
    const wrapper = mount(
      {
        data() {
          return {
            disabled: false,
          }
        },
        template: `<FormKit
          type="form"
          :submit-attrs="{ id: '${id}' }"
          disabled
        >
        </FormKit>`,
      },
      global
    )
    expect(
      wrapper.find('[data-type="submit"]').element.hasAttribute('data-disabled')
    ).toBe(true)
  })

  it('can swap languages', async () => {
    const wrapper = mount(
      {
        template: `<FormKit type="form">
        <FormKit type="email" validation-visibility="live" label="Email" validation="required" />
      </FormKit>`,
        methods: {
          german() {
            this.$formkit.setLocale('de')
          },
        },
      },
      {
        global: {
          plugins: [
            [
              plugin,
              defaultConfig({
                locales: { de },
              }),
            ],
          ],
        },
      }
    )
    expect(wrapper.find('button').text()).toBe('Submit')
    expect(wrapper.find('.formkit-message').text()).toBe('Email is required.')
    wrapper.vm.german()
    await nextTick()
    expect(wrapper.find('button').text()).toBe('Senden')
    expect(wrapper.find('.formkit-message').text()).toBe(
      'Email ist erforderlich.'
    )
  })

  it('can display form level errors with setErrors', async () => {
    const error = token()
    const wrapper = mount(
      {
        template: `<FormKit type="form" id="form" @submit="handle">
        <FormKit type="email" validation-visibility="live" label="Email" />
      </FormKit>`,
        methods: {
          handle() {
            this.$formkit.setErrors('form', [error])
          },
        },
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.html()).toContain(error)
  })

  it('can display input level errors with setErrors', async () => {
    let error1 = token()
    const error2 = token()
    const wrapper = mount(
      {
        template: `<FormKit type="form" id="form" @submit="handle">
        <FormKit type="email" name="email" />
        <FormKit type="select" name="second" />
      </FormKit>`,
        methods: {
          handle() {
            this.$formkit.setErrors('form', { email: error1, second: [error2] })
          },
        },
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.html()).toContain(error1)
    expect(wrapper.html()).toContain(error2)

    const firstError1 = error1
    error1 = token()
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.html()).toContain(error1)
    expect(wrapper.html()).not.toContain(firstError1)
  })

  it('can set errors using the composition API', async () => {
    const wrapper = mount(
      {
        template: `<FormKit type="form" id="form" @submit="handle">
        <FormKit type="email" name="email" />
        <FormKit type="select" name="second" />
      </FormKit>`,
        setup() {
          const handle = () => {
            setErrors(
              'form',
              {
                email: ['This is foobar'],
                second: 'but this is not',
              },
              ['This is also fooooobar']
            )
          }
          return {
            handle,
          }
        },
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.html()).toContain('This is foobar')
    expect(wrapper.html()).toContain('but this is not')
    expect(wrapper.html()).toContain('This is also fooooobar')
  })

  it('removes values of inputs that are removed', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            values: {},
            useEmail: true,
          }
        },
        template: `<FormKit type="form" v-model="values">
        <FormKit type="email" name="email" value="jon@doe.com" v-if="useEmail" />
        <FormKit type="text" name="name" value="Jon" />
      </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    expect(wrapper.vm.values).toStrictEqual({
      email: 'jon@doe.com',
      name: 'Jon',
    })
    wrapper.vm.useEmail = false
    await nextTick()
    expect(wrapper.vm.values).toStrictEqual({ name: 'Jon' })
  })

  it('resets the local value of an input whose key changes', async () => {
    const id = `a_${token()}`
    const wrapper = mount(
      {
        data() {
          return {
            key: 'abc',
          }
        },
        template: `<FormKit type="form" #default="{ value }">
        <pre>{{ value }}</pre>
        <FormKit type="text" name="name" id="${id}" :key="key" :delay="0" />
      </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    wrapper.find(`#${id}`).setValue('foobar')
    await new Promise((r) => setTimeout(r, 20))
    expect(wrapper.find('pre').text()).toBe(`{
  "name": "foobar"
}`)
    wrapper.vm.key = 'bar'
    await nextTick()
    expect(wrapper.find('pre').text()).toBe(`{}`)
    expect((wrapper.find(`#${id}`).element as HTMLInputElement).value).toBe('')
  })

  it('keeps data with preserve prop', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            values: {},
            useEmail: true,
          }
        },
        template: `<FormKit type="form" v-model="values">
        <FormKit type="email" name="email" value="jon@doe.com" preserve v-if="useEmail" />
        <FormKit type="text" name="name" value="Jon" />
      </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    wrapper.vm.useEmail = false
    await nextTick()
    expect(wrapper.vm.values).toStrictEqual({
      email: 'jon@doe.com',
      name: 'Jon',
    })
  })

  it('keeps checks ancestors for preserve prop', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            values: {},
            useEmail: true,
          }
        },
        template: `<FormKit type="form" v-model="values" preserve>
        <FormKit type="email" name="email" value="jon@doe.com" v-if="useEmail" />
        <FormKit type="text" name="name" value="Jon" />
      </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    wrapper.vm.useEmail = false
    await nextTick()
    expect(wrapper.vm.values).toStrictEqual({
      email: 'jon@doe.com',
      name: 'Jon',
    })
  })

  it('can override config values for children', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            group: { foo: 'bar' },
          }
        },
        template: `<FormKit type="form" v-model="group" :config="{ delay: 80 }">
          <FormKit type="text" name="foo" />
        </FormKit>`,
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

  it('can show an incomplete message', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            group: { foo: 'bar' },
          }
        },
        template: `<FormKit type="form">
          <FormKit type="text" name="foo" validation="required" />
        </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 22))
    expect(wrapper.html()).toContain(en.ui.incomplete)
  })

  it('can disable the incomplete message', async () => {
    const wrapper = mount(
      {
        template: `<FormKit type="form" :incomplete-message="false">
          <FormKit type="text" name="foo" validation="required" />
        </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 22))
    expect(wrapper.html()).not.toContain(en.ui.incomplete)
  })

  it('allows a custom incomplete message', async () => {
    const wrapper = mount(
      {
        template: `<FormKit type="form" incomplete-message="Do better on your form please.">
          <FormKit type="text" name="foo" validation="required" />
        </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 22))
    expect(wrapper.html()).toContain('Do better on your form please.')
  })

  it('disables the form while in the loading state', async () => {
    const wrapper = mount(
      {
        methods: {
          doSave() {
            return new Promise((r) => setTimeout(r, 20))
          },
        },
        template: `<FormKit type="form" @submit="doSave">
          <FormKit type="group">
            <FormKit type="text" name="foo" />
          </FormKit>
        <FormKit type="text" name="foo" />
      </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    const button = wrapper.find('button')
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.find('form').element.hasAttribute('data-loading')).toBe(true)
    expect(
      wrapper.findAll('input').map((input) => input.element.disabled)
    ).toEqual([true, true])
    expect(button.element.disabled).toBe(true)
    await new Promise((r) => setTimeout(r, 20))
    expect(wrapper.find('form').element.hasAttribute('data-loading')).toBe(
      false
    )
    expect(
      wrapper.findAll('input').map((input) => input.element.disabled)
    ).toEqual([false, false])
    expect(button.element.disabled).toBe(false)
  })

  it('the form remains enabled if submit-behavior is live', async () => {
    const wrapper = mount(
      {
        methods: {
          doSave() {
            return new Promise((r) => setTimeout(r, 50))
          },
        },
        template: `<FormKit type="form" @submit="doSave" submit-behavior="live">
        <FormKit type="text" name="foo" />
      </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    const button = wrapper.find('button')
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 15))
    expect(wrapper.find('form').element.hasAttribute('data-loading')).toBe(true)
    expect(button.element.disabled).toBe(false)
  })

  it('ignores buttons by default', () => {
    const wrapper = mount(
      {
        data() {
          return {
            values: {},
          }
        },
        template: `<FormKit type="form" v-model="values">
        <FormKit type="button" name="foo" />
      </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.vm.values).toStrictEqual({})
  })

  it('can unignore buttons', () => {
    const wrapper = mount(
      {
        data() {
          return {
            values: {},
          }
        },
        template: `<FormKit type="form" v-model="values">
        <FormKit type="button" name="foo" :ignore="false" />
      </FormKit>`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.vm.values).toStrictEqual({ foo: undefined })
  })

  it('can set errors on the form using the node passed in the submit handler', async () => {
    const wrapper = mount(
      {
        methods: {
          submitHandler(_data: any, node: FormKitNode) {
            node.setErrors('Woops your phone battery is low')
          },
        },
        template: `<FormKit type="form" @submit="submitHandler">
        <FormKit type="text" name="name" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.html()).toContain('Woops your phone battery is low')
  })

  it('can unignore the default action with submit-attrs', async () => {
    const wrapper = mount(
      {
        methods: {
          setLabel(node: FormKitNode) {
            node.on('created', () => {
              node.props.label = 'Plugin did run'
            })
          },
        },
        template: `<FormKit type="form" :plugins="[setLabel]" :submit-attrs="{ ignore: false }">
      </FormKit>`,
      },
      global
    )
    expect(wrapper.html()).toContain('Plugin did run')
  })
})

describe('programmatic submission', () => {
  it('can be submitted programmatically', async () => {
    const id = 'programmatic-form-test'
    const submit = vi.fn()
    const submitRaw = vi.fn()
    const warning = vi.fn(() => {})
    const mock = vi.spyOn(console, 'warn').mockImplementation(warning)
    const wrapper = mount(
      {
        template: `
        <FormKit
          type="form"
          id="${id}"
          @submit-raw="submitRawHandler"
          @submit="submitHandler"
        >
          <FormKit name="foo" type="number" :delay="0" validation="required" />
          <FormKit name="bar" type="select" :delay="0" :options="{abc: 'def', xyz: 'bem'}" value="xyz" />
        </FormKit>
      `,
        methods: {
          submit() {
            this.$formkit.submit(id)
          },
          submitHandler(data: any) {
            submit(data)
          },
          submitRawHandler() {
            submitRaw()
          },
        },
      },
      {
        attachTo: document.body,
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    wrapper.vm.submit()
    mock.mockRestore()
    await nextTick()
    expect(warning).toHaveBeenCalledTimes(0)
    expect(submitRaw).toHaveBeenCalledTimes(1)
    const form = getNode(id)
    form!.at('foo')!.input(123)
    await new Promise((r) => setTimeout(r, 10))
    form!.submit()
    await new Promise((r) => setTimeout(r, 50))
    expect(submitRaw).toHaveBeenCalledTimes(2)
    expect(submit).toHaveBeenCalledWith({
      foo: 123,
      bar: 'xyz',
    })
  })

  it('can be submitted by child node', async () => {
    const id = 'childInput'
    const submit = vi.fn()
    const submitRaw = vi.fn()
    const wrapper = mount(
      {
        template: `
        <FormKit
          type="form"
          @submit-raw="submitRawHandler"
          @submit="submitHandler"
        >
          <FormKit type="list">
            <FormKit type="group">
              <FormKit id="${id}" name="foo" type="number" :delay="0" validation="required" />
            </FormKit>
          </FormKit>
        </FormKit>
      `,
        methods: {
          submit() {
            getNode(id)?.submit()
          },
          submitHandler(data: any) {
            submit(data)
          },
          submitRawHandler() {
            submitRaw()
          },
        },
      },
      {
        attachTo: document.body,
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    wrapper.vm.submit()
    await nextTick()
    expect(submitRaw).toHaveBeenCalledTimes(1)
    expect(submit).toHaveBeenCalledTimes(0)
    getNode(id)!.input(123)
    await new Promise((r) => setTimeout(r, 15))
    wrapper.vm.submit()
    await nextTick()
    expect(submitRaw).toHaveBeenCalledTimes(2)
    expect(submit).toHaveBeenCalledTimes(1)
  })
})

describe('resetting', () => {
  it('can be reset to a specific value', async () => {
    const submitHandler = vi.fn()
    const formId = token()
    const form = mount(
      {
        data() {
          return {
            values: {
              address: { street: 'Downing St.' },
            },
          }
        },
        methods: {
          handler() {
            submitHandler()
          },
        },
        template: `
        <FormKit type="form" v-model="values" @submit="handler" id="${formId}">
          <FormKit name="email" value="test@example.com" />
          <FormKit type="group" name="address">
            <FormKit name="street" />
            <FormKit type="radio" name="zip" :options="['2001', '2002']" validation="required" help="hi" :sections-schema="{ help: { children: '$fns.json($state)' } }" />
          </FormKit>
        </FormKit>
      `,
      },
      {
        attachTo: document.body,
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(form.vm.values).toStrictEqual({
      email: 'test@example.com',
      address: {
        street: 'Downing St.',
        zip: undefined,
      },
    })
    form.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 10))
    expect(form.find('.formkit-message').exists()).toBe(true)
    setErrors(formId, [], {
      'address.zip': ['This is an error'],
    })
    await new Promise((r) => setTimeout(r, 200))
    reset(formId, {})
    await new Promise((r) => setTimeout(r, 20))
    expect(form.vm.values).toStrictEqual({
      email: undefined,
      address: {
        street: undefined,
        zip: undefined,
      },
    })
    expect(form.vm.values.propertyIsEnumerable('__init')).toBe(false)
    expect(form.find('.formkit-message').exists()).toBe(false)
  })

  it('reacts to changes on the inputErrors prop', async () => {
    const errors = ref<Record<string, string>>({ email: 'foo bar is bad' })
    const form = mount(
      {
        setup() {
          return { errors }
        },
        template: `
        <FormKit type="form" :input-errors="errors">
          <FormKit name="email" value="test@example.com" />
        </FormKit>
      `,
      },
      {
        attachTo: document.body,
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )

    expect(form.html()).toContain('foo bar is bad')
    errors.value = { email: 'foo bar is good' }
    await nextTick()
    expect(form.html()).toContain('foo bar is good')
    errors.value = {}
    await nextTick()
    expect(form.html()).not.toContain('foo bar is good')
  })
})

describe('submit hook', () => {
  it('can change the fields before submitting', async () => {
    const id = 'programmatic-form-test'
    const submitHandler = vi.fn()
    const wrapper = mount(
      {
        methods: {
          submitHandler,
        },
        template: `<FormKit id="${id}" type="form" @submit="(fields) => submitHandler(fields)">
          <FormKit validation="required|email" name="email" value="foo@bar.com" />
        </FormKit>`,
      },
      global
    )
    const form = getNode(id)
    form?.hook.submit((payload, next) => {
      payload.email = 'modifiedfoo@bar.com'
      payload.newField = 'my new field'
      return next(payload)
    })
    wrapper.find('form').trigger('submit')
    await nextTick()
    expect(submitHandler).toHaveBeenCalledWith({
      email: 'modifiedfoo@bar.com',
      newField: 'my new field',
    })
  })
})

describe('v-model', () => {
  it('can change a value and add a value in a single tick cycle', async () => {
    const id = token()
    const wrapper = mount(
      {
        data() {
          return {
            data: {
              field_a: '',
            },
          } as { data: any }
        },
        template: `
        <FormKit type="form" v-model="data">
          <FormKit
            id="${id}"
            type="select"
            label="field A"
            name="field_a"
            :delay="0"
            placeholder="Choose a food"
            :options="['Pizza', 'Ice Cream', 'Burger']"
            @change="()=>{ data.name2 = 'added' }"
          />
        </FormKit>
        <pre>{{ data }}</pre>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    await nextTick()
    wrapper.find('select').setValue('Burger')
    wrapper.find('select').trigger('input')
    await new Promise((r) => setTimeout(r, 20))
    expect(wrapper.vm.data).toStrictEqual({ field_a: 'Burger', name2: 'added' })
    expect(getNode(id)?.value).toBe('Burger')
  })
})

describe('submit-invalid', () => {
  it('calls the submit-invalid handler', async () => {
    const invalidHandler = vi.fn()
    const wrapper = mount(
      {
        methods: {
          invalidHandler,
        },
        template: `
        <FormKit type="form" @submit-invalid="invalidHandler">
          <FormKit
            type="text"
            label="Some field"
            name="myInput"
            :delay="0"
            validation="required|length:10"
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
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 20))
    expect(invalidHandler).toBeCalledTimes(1)
  })
})

describe('FormKitMessages', () => {
  it('can render messages in a new location', async () => {
    const handler = vi.fn((_data: any, node?: FormKitNode) => {
      node?.setErrors(['Oops, an error occurred.'])
    })
    const wrapper = mount(
      {
        methods: {
          handler,
        },
        components: {
          FormKitMessages,
        },
        template: `
        <FormKit type="form" @submit="handler">
          <div><FormKitMessages /></div>
          <FormKit
            type="text"
            label="Some field"
            name="myInput"
            :delay="0"
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
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 50))
    expect(handler).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.formkit-outer .formkit-messages').exists()).toBe(
      false
    )
    expect(wrapper.find('.formkit-messages').exists()).toBe(true)
  })
  it('can render messages in a new location', async () => {
    const handler = vi.fn((_data: any, node?: FormKitNode) => {
      node?.setErrors(['Oops, an error occurred.'])
    })
    const wrapper = mount(
      {
        methods: {
          handler,
          setNode(node: FormKitNode) {
            this.node = node
          },
        },
        components: {
          FormKitMessages,
        },
        data() {
          return {
            node: null as FormKitNode | null,
          }
        },
        template: `
        <FormKitMessages :node="node" />
        <FormKit type="form" @submit="handler" @node="setNode">
          <FormKit
            type="text"
            label="Some field"
            name="myInput"
            :delay="0"
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
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 50))
    expect(handler).toHaveBeenCalledTimes(1)
    expect(wrapper.find('form .formkit-messages').exists()).toBe(false)
    expect(wrapper.find('.formkit-messages').exists()).toBe(true)
  })
  it('can render messages in both locations including the original', async () => {
    const handler = vi.fn((_data: any, node?: FormKitNode) => {
      node?.setErrors(['Oops, an error occurred.'])
    })
    const wrapper = mount(
      {
        methods: {
          handler,
          setNode(node: FormKitNode) {
            this.node = node
          },
        },
        components: {
          FormKitMessages,
        },
        data() {
          return {
            node: null as FormKitNode | null,
          }
        },
        template: `
        <div id="container">
          <FormKitMessages :node="node" :default-position="true" />
          <FormKit type="form" @submit="handler" @node="setNode">
            <FormKit
              type="text"
              label="Some field"
              name="myInput"
              :delay="0"
            />
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
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 50))
    expect(handler).toHaveBeenCalledTimes(1)
    expect(wrapper.find('form > .formkit-messages').exists()).toBe(true)
    expect(wrapper.get('#container').findAll('.formkit-messages').length).toBe(
      2
    )
  })

  it('can override the schema of FormKitMessages', async () => {
    const handler = vi.fn((_data: any, node?: FormKitNode) => {
      node?.setErrors(['Oops, an error occurred.'])
    })
    const wrapper = mount(
      {
        methods: {
          handler,
        },
        components: {
          FormKitMessages,
        },
        template: `
        <FormKit type="form" @submit="handler">
          <FormKitMessages
            :sections-schema="{
              messages: {
                $el: 'div',
              }
            }"
          />
          <FormKit
            type="text"
            label="Some field"
            name="myInput"
            :delay="0"
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
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 50))
    expect(wrapper.find('form > div.formkit-messages').exists()).toBe(true)
  })
})
