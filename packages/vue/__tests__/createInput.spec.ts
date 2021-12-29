import { mount } from '@vue/test-utils'
import { token } from '@formkit/utils'
import { createInput } from '../src/composables/createInput'
import CustomCompositionInput from './mocks/CustomCompositionInput'
import CustomOptionsInput from './mocks/CustomOptionsInput'
import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { nextTick } from 'vue'

describe('schema based inputs', () => {
  it('automatically has labels and help text', () => {
    const foo = createInput('hello')
    const label = token()
    const help = token()
    const wrapper = mount(FormKit, {
      props: {
        type: foo,
        name: 'custom',
        label,
        help,
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toContain(label)
    expect(wrapper.html()).toContain(help)
  })

  it('can output the value of the node', () => {
    const foo = createInput('$_value')
    const value = token()
    const wrapper = mount(FormKit, {
      props: {
        type: foo,
        name: 'custom',
        value,
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toContain(value)
  })

  it('can update a groups value', async () => {
    const foo = createInput({
      $el: 'input',
      attrs: {
        onInput: '$handlers.DOMInput',
        value: '$_value',
      },
    })
    const value = token()
    const wrapper = mount(
      {
        data() {
          return {
            group: {
              wham: value,
            },
          }
        },
        template: `
      <FormKit type="group" v-model="group">
        <FormKit type="foo" name="wham" />
      </FormKit>
      `,
      },
      {
        global: {
          plugins: [
            [
              plugin,
              defaultConfig({
                inputs: { foo },
              }),
            ],
          ],
        },
      }
    )
    expect(wrapper.find('input').element.value).toBe(value)
    wrapper.setData({ group: { wham: 'bizbaz' } })
    await nextTick()
    expect(wrapper.find('input').element.value).toBe('bizbaz')
  })
})

describe('vue component inputs', () => {
  it('can use a vue component with composition api', async () => {
    const box = createInput(CustomCompositionInput)
    const wrapper = mount(
      {
        data() {
          return {
            box: true,
          }
        },
        template: `<FormKit v-model="box" type="box" />`,
      },
      {
        global: {
          plugins: [
            [
              plugin,
              defaultConfig({
                inputs: { box },
              }),
            ],
          ],
        },
      }
    )
    expect(wrapper.find('input').element.checked).toBe(true)
    wrapper.find('input').element.checked = false
    wrapper.find('input').trigger('input')
    await new Promise((r) => setTimeout(r, 22))
    expect(wrapper.vm.box).toBe(false)
  })

  it('can use a vue component with options api', async () => {
    const box = createInput(CustomOptionsInput)
    const wrapper = mount(
      {
        data() {
          return {
            box: true,
          }
        },
        template: `<FormKit v-model="box" type="box" />`,
      },
      {
        global: {
          plugins: [
            [
              plugin,
              defaultConfig({
                inputs: { box },
              }),
            ],
          ],
        },
      }
    )
    expect(wrapper.find('input').element.checked).toBe(true)
    wrapper.find('input').element.checked = false
    wrapper.find('input').trigger('input')
    await new Promise((r) => setTimeout(r, 22))
    expect(wrapper.vm.box).toBe(false)
  })
})
