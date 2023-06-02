import { token } from '@formkit/utils'
import { getNode } from '@formkit/core'
import FormKit from '../../src/FormKit'
import { plugin } from '../../src/plugin'
import defaultConfig from '../../src/defaultConfig'
import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'

const global: Record<string, Record<string, any>> = {
  global: {
    plugins: [[plugin, defaultConfig]],
  },
}

describe('text classification', () => {
  it('can render a text input', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        value: 133,
      },
      ...global,
    })
    expect(wrapper.html()).toContain('<input class="formkit-input" type="text"')
  })

  it('renders arbitrary attributes on the input element', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        name: 'food',
      },
      attrs: {
        id: 'foobar',
        placeholder: 'Favorite food?',
      },
      ...global,
    })
    expect(wrapper.html()).toContain(
      '<input placeholder="Favorite food?" class="formkit-input" type="text" name="food" id="foobar">'
    )
  })

  it('can disable a text input', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        disabled: true,
      },
      ...global,
    })
    expect(wrapper.find('.formkit-outer[data-disabled]').exists()).toBe(true)
    expect(wrapper.find('input[disabled]').exists()).toBe(true)
  })

  it('throws an error when provided input type is not in library', () => {
    const consoleWarnMock = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})
    expect(() =>
      mount(FormKit, { props: { type: 'foobar' }, ...global })
    ).toThrow(Error)
    consoleWarnMock.mockRestore()
  })

  it('renders color input when type is "color"', () => {
    const wrapper = mount(FormKit, { props: { type: 'color' }, ...global })
    expect(wrapper.html()).toContain('type="color"')
  })

  it('renders date input when type is "date"', () => {
    const wrapper = mount(FormKit, { props: { type: 'date' }, ...global })
    expect(wrapper.html()).toContain('type="date"')
  })

  it('renders datetime-local input when type is "datetime-local"', () => {
    const wrapper = mount(FormKit, {
      props: { type: 'datetime-local' },
      ...global,
    })
    expect(wrapper.html()).toContain('type="datetime-local"')
  })

  it('renders email input when type is "email"', () => {
    const wrapper = mount(FormKit, { props: { type: 'email' }, ...global })
    expect(wrapper.html()).toContain('type="email"')
  })

  it('renders hidden input when type is "hidden"', () => {
    const wrapper = mount(FormKit, { props: { type: 'hidden' }, ...global })
    expect(wrapper.html()).toContain('type="hidden"')
  })

  it('renders month input when type is "month"', () => {
    const wrapper = mount(FormKit, { props: { type: 'month' }, ...global })
    expect(wrapper.html()).toContain('type="month"')
  })

  it('renders number input when type is "number"', () => {
    const wrapper = mount(FormKit, { props: { type: 'number' }, ...global })
    expect(wrapper.html()).toContain('type="number"')
  })

  it('renders password input when type is "password"', () => {
    const wrapper = mount(FormKit, { props: { type: 'password' }, ...global })
    expect(wrapper.html()).toContain('type="password"')
  })

  it('renders search input when type is "search"', () => {
    const wrapper = mount(FormKit, { props: { type: 'search' }, ...global })
    expect(wrapper.html()).toContain('type="search"')
  })

  it('renders tel input when type is "tel"', () => {
    const wrapper = mount(FormKit, { props: { type: 'tel' }, ...global })
    expect(wrapper.html()).toContain('type="tel"')
  })

  it('renders time input when type is "time"', () => {
    const wrapper = mount(FormKit, { props: { type: 'time' }, ...global })
    expect(wrapper.html()).toContain('type="time"')
  })

  it('renders text input when type is "text"', () => {
    const wrapper = mount(FormKit, { props: { type: 'text' }, ...global })
    expect(wrapper.html()).toContain('type="text"')
  })

  it('renders url input when type is "url"', () => {
    const wrapper = mount(FormKit, { props: { type: 'url' }, ...global })
    expect(wrapper.html()).toContain('type="url"')
  })

  it('renders week input when type is "week"', () => {
    const wrapper = mount(FormKit, { props: { type: 'week' }, ...global })
    expect(wrapper.html()).toContain('type="week"')
  })

  it('renders the text family for all text based inputs', () => {
    const textInputs = [
      'color',
      'date',
      'datetime-local',
      'email',
      'month',
      'number',
      'password',
      'search',
      'tel',
      'text',
      'time',
      'url',
      'week',
    ]
    textInputs.forEach((type) => {
      const wrapper = mount(FormKit, { props: { type }, ...global })
      expect(wrapper.html()).toContain('data-family="text"')
    })
  })

  it('can add a blur handler to a text input', async () => {
    const onBlur = vi.fn()
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        onBlur,
      },
      ...global,
    })
    wrapper.find('input').trigger('blur')
    await nextTick()
    expect(onBlur).toHaveBeenCalled()
  })

  it('can render a text input with a null value', async () => {
    const id = token()
    const wrapper = mount(FormKit, {
      props: {
        id,
        type: 'text',
        value: null,
      },
      ...global,
    })
    const node = getNode(id)!
    expect(node.value).toBe(null)
    node.input(null)
    await nextTick()
    expect(wrapper.find('input').element.value).toBe('')
  })
})
