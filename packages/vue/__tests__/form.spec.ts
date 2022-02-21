import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { getNode, setErrors, FormKitNode } from '@formkit/core'
import { de, en } from '@formkit/i18n'
import { token } from '@formkit/utils'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { jest } from '@jest/globals'
import { ref, reactive } from 'vue'

const global: Record<string, Record<string, any>> = {
  global: {
    plugins: [[plugin, defaultConfig]],
  },
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
      .toEqual(`<form id="foo" class="formkit-form" name="test_form">
  <h1>in the form</h1>
  <!---->
  <div class="formkit-actions">
    <div class="formkit-outer" data-type="submit">
      <!---->
      <div class="formkit-wrapper"><button type="submit" class="formkit-input" name="submit_1" id="button">
          <!---->Submit
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
    await nextTick()
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

  it('can set the state of checkboxes from a v-model using vue reactive object', async () => {
    const wrapper = mount(
      {
        setup() {
          const options = ['a', 'b', 'c']
          const values = reactive<{ form: Record<string, any> }>({ form: {} })
          const changeValues = () => {
            values.form.foo = 'bar bar'
          }
          return { options, values, changeValues }
        },
        template: `<FormKit type="form" v-model="values.form">
        <FormKit type="text" name="foo" />
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
    expect(wrapper.find('input').element.value).toEqual('')
    wrapper.find('button[type="button"').trigger('click')
    await nextTick()
    expect(wrapper.find('input').element.value).toStrictEqual('bar bar')
  })
})

describe('form submission', () => {
  it('wont submit the form when it has errors', async () => {
    const submitHandler = jest.fn()
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
    const submitHandler = jest.fn()
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
    const submitHandler = jest.fn()
    const wrapper = mount(
      {
        methods: {
          submitHandler,
        },
        template: `<FormKit type="form" @submit="submitHandler">
        <FormKit id="email" validation="required|email" />
      </FormKit>`,
      },
      global
    )
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 5))
    const node = getNode('email')
    expect(node?.context?.state?.submitted).toBe(true)
    expect(wrapper.find('.formkit-message').exists()).toBe(true)
  })

  it('fires a submit-raw event even with validation errors', async () => {
    const submitHandler = jest.fn()
    const rawHandler = jest.fn()
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

  it('sets a loading state if handler is async', async () => {
    const submitHandler = jest.fn(() => {
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

  it('keeps data with keep prop', async () => {
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
            return new Promise((r) => setTimeout(r, 50))
          },
        },
        template: `<FormKit type="form" @submit="doSave">
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
    wrapper.find('form').element.submit()
    await new Promise((r) => setTimeout(r, 5))
    expect(button.element.hasAttribute('data-loading')).toBe(true)
    expect(button.element.disabled).toBe(true)
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
    wrapper.find('form').element.submit()
    await new Promise((r) => setTimeout(r, 5))
    expect(button.element.hasAttribute('data-loading')).toBe(true)
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
            node.setErrors(['Woops your phone battery is low'])
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
})

describe('programmatic submission', () => {
  it('can be submitted programmatically', async () => {
    const id = 'programmatic-form-test'
    const submit = jest.fn()
    const submitRaw = jest.fn()
    const warning = jest.fn(() => {})
    const mock = jest.spyOn(console, 'warn').mockImplementation(warning)
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
          <FormKit name="bar" type="select" :options="{abc: 'def', xyz: 'bem'}" value="xyz" />
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
    await nextTick()
    expect(submitRaw).toHaveBeenCalledTimes(2)
    expect(submit).toHaveBeenCalledWith({
      foo: 123,
      bar: 'xyz',
    })
  })

  it('can be submitted by child node', async () => {
    const id = 'childInput'
    const submit = jest.fn()
    const submitRaw = jest.fn()
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
