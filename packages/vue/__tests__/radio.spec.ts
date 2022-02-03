import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { mount } from '@vue/test-utils'
import { jest } from '@jest/globals'

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
      '<input type="radio" class="formkit-input" name="radio_1" id="radio_1-option-foo" value="Foo">'
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
})
