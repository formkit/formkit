import { mount } from '@vue/test-utils'
import { token } from '@formkit/utils'
import type { FormKitNode } from '@formkit/core'
import { createInput } from '../src/composables/createInput'
import CustomCompositionInput from './mocks/CustomCompositionInput'
import CustomOptionsInput from './mocks/CustomOptionsInput'
import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { nextTick } from 'vue'
import { jest } from '@jest/globals'

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

  it('can create an input with a fragment as the schema', () => {
    const foo = createInput([{ $el: 'header' }, { $el: 'footer' }])
    const wrapper = mount(FormKit, {
      props: {
        type: foo,
        name: 'custom',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('footer').exists()).toBe(true)
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

describe('custom input behaviors', () => {
  it('does not emit prop:{property} events for input props', async () => {
    const pseudoPropEvent = jest.fn()
    const nativePropEvent = jest.fn()
    const input = createInput('test input', {
      props: ['bizBaz'],
      features: [
        (node: FormKitNode) => {
          node.on('prop:bizBaz', pseudoPropEvent)
          node.on('prop:delay', nativePropEvent)
        },
      ],
    })
    mount(FormKit, {
      props: {
        type: input,
        bizBaz: 'hello',
        delay: 10,
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    await nextTick()
    expect(nativePropEvent).toHaveBeenCalledTimes(0)
    expect(pseudoPropEvent).toHaveBeenCalledTimes(0)
  })
})
