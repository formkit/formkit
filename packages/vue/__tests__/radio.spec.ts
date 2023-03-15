import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { mount } from '@vue/test-utils'
import { jest } from '@jest/globals'
import { token } from '@formkit/utils'
import { getNode } from '@formkit/core'
import { ref } from 'vue'

const global: Record<string, Record<string, any>> = {
  global: {
    plugins: [[plugin, defaultConfig]],
  },
}

describe('radios', () => {
  it('can render radio inputs', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'radio',
        options: ['Foo', 'Bar'],
      },
      ...global,
    })
    expect(wrapper.html()).toContain(
      '<input class="formkit-input" type="radio" name="radio_1" id="radio_1-option-foo" value="Foo">'
    )
  })

  it('can select and unselect radio inputs', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            value: 'bar',
          }
        },
        template: `<FormKit :delay="0" v-model="value" type="radio" :options="{
          foo: 'Foo',
          bar: 'Bar',
          fiz: 'Fiz',
          buzz: 'Buzz'
        }" />`,
      },
      {
        ...global,
      }
    )
    // TODO - Remove the .get() here when @vue/test-utils > rc.19
    const radios = wrapper.get('fieldset').findAll('input')
    expect(radios[0].element.checked).toBe(false)
    expect(radios[1].element.checked).toBe(true)
    expect(radios[2].element.checked).toBe(false)
    expect(radios[3].element.checked).toBe(false)
    wrapper.setData({ value: 'fiz' })
    await new Promise((r) => setTimeout(r, 5))
    expect(radios[0].element.checked).toBe(false)
    expect(radios[1].element.checked).toBe(false)
    expect(radios[2].element.checked).toBe(true)
    expect(radios[3].element.checked).toBe(false)
    radios[3].element.checked = true
    radios[3].trigger('input')
    await new Promise((r) => setTimeout(r, 5))
    expect(radios[2].element.checked).toBe(false)
    expect(wrapper.vm.value).toBe('buzz')
  })

  it('throws a warning if no options are provided', () => {
    const warning = jest.fn(() => {})
    const consoleWarnMock = jest
      .spyOn(console, 'warn')
      .mockImplementation(warning)
    mount(FormKit, {
      props: {
        type: 'radio',
      },
      ...global,
    })
    consoleWarnMock.mockRestore()
    expect(warning).toHaveBeenCalledTimes(1)
  })

  it('changes the selected radios when value is set on node', async () => {
    const id = token()
    const wrapper = mount(
      {
        data() {
          return {
            value: 'B',
          }
        },
        template: `<FormKit id="${id}" :delay="0" v-model="value" type="radio" :options="[
          'A',
          'B',
          'C'
        ]" />`,
      },
      {
        ...global,
      }
    )
    const inputs = wrapper.get('div').findAll('input[type="radio"]')
    expect(
      inputs.map((input) => (input.element as HTMLInputElement).checked)
    ).toStrictEqual([false, true, false])
    const node = getNode(id)
    node?.input('C')
    await new Promise((r) => setTimeout(r, 10))
    expect(
      inputs.map((input) => (input.element as HTMLInputElement).checked)
    ).toStrictEqual([false, false, true])
    node?.input('A')
    await new Promise((r) => setTimeout(r, 10))
    expect(
      inputs.map((input) => (input.element as HTMLInputElement).checked)
    ).toStrictEqual([true, false, false])
  })

  it('can have an object value', async () => {
    const id = token()
    const wrapper = mount(
      {
        template: `<FormKit
          id="${id}"
          :delay="0"
          type="radio"
          :value="{ foo: 'bar' }"
          :options="[
            { value: { foo: 'bar'}, label: 'foobar' },
            { value: { fruit: 'banana' }, label: 'fruit' }
          ]" />`,
      },
      {
        ...global,
      }
    )
    const radios = wrapper.get('div').findAll('input')
    expect(
      radios.map((radio) => (radio.element as HTMLInputElement).checked)
    ).toEqual([true, false])
    radios[1].element.checked = true
    radios[1].trigger('input')
    await new Promise((r) => setTimeout(r, 20))
    expect(
      radios.map((radio) => (radio.element as HTMLInputElement).checked)
    ).toEqual([false, true])
    expect(getNode(id)!.value).toEqual({ fruit: 'banana' })
  })

  it('can have a null value', async () => {
    const id = token()
    const wrapper = mount(
      {
        template: `<FormKit
          id="${id}"
          :delay="0"
          type="radio"
          :value="false"
          :options="[
            { value: null, label: 'foobar' },
            { value: false, label: 'fruit' },
            { value: true, label: 'todd' }
          ]" />`,
      },
      {
        ...global,
      }
    )
    const radios = wrapper.get('div').findAll('input')
    expect(
      radios.map((radio) => (radio.element as HTMLInputElement).checked)
    ).toEqual([false, true, false])
    radios[0].element.checked = true
    radios[0].trigger('input')
    await new Promise((r) => setTimeout(r, 20))
    expect(
      radios.map((radio) => (radio.element as HTMLInputElement).checked)
    ).toEqual([true, false, false])
    expect(getNode(id)!.value).toEqual(null)
  })

  it('can have map values', async () => {
    const id = token()
    const wrapper = mount(
      {
        data() {
          return {
            value: new Map([['a', 'first']]),
          }
        },
        template: `<FormKit
          id="${id}"
          :delay="0"
          type="radio"
          :value="value"
          :options="[
            { value: null, label: 'foobar' },
            { value: value, label: 'fruit' },
            { value: true, label: 'todd' }
          ]" />`,
      },
      {
        ...global,
      }
    )
    const radios = wrapper.get('div').findAll('input')
    expect(
      radios.map((radio) => (radio.element as HTMLInputElement).checked)
    ).toEqual([false, true, false])
    radios[0].element.checked = true
    radios[0].trigger('input')
    await new Promise((r) => setTimeout(r, 20))
    expect(
      radios.map((radio) => (radio.element as HTMLInputElement).checked)
    ).toEqual([true, false, false])
    expect(getNode(id)!.value).toEqual(null)
  })

  it('applies undefined to a "false" disabled prop', async () => {
    const disabled = ref('false')
    const wrapper = mount(
      {
        setup() {
          return { disabled }
        },
        template: `<FormKit
          type="radio"
          :disabled="disabled"
          :options="[
            { value: null, label: 'foobar' },
            { value: false, label: 'fruit' },
            { value: true, label: 'todd' }
          ]" />`,
      },
      {
        ...global,
      }
    )
    expect(wrapper.find('.formkit-outer').attributes('data-disabled')).toBe(
      undefined
    )
    disabled.value = 'true'
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('.formkit-outer').attributes('data-disabled')).toBe(
      'true'
    )
  })

  it('can differentiate between undefined and null option values', async () => {
    const id = token()
    const wrapper = mount(
      {
        data() {
          return {
            value: undefined,
          }
        },
        template: `<FormKit
          id="${id}"
          :delay="0"
          type="radio"
          :value="value"
          :options="[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
            { value: null, label: 'N/A' }
          ]" />`,
      },
      {
        ...global,
      }
    )
    const radios = wrapper.get('div').findAll('input')
    expect(
      radios.map((radio) => (radio.element as HTMLInputElement).checked)
    ).toEqual([false, false, false])
    radios[1].element.checked = true
  })
})
