import FormKit from '../../src/FormKit'
import { plugin } from '../../src/plugin'
import defaultConfig from '../../src/defaultConfig'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

const global: Record<string, Record<string, any>> = {
  global: {
    plugins: [[plugin, defaultConfig]],
  },
}

describe('textarea classification', () => {
  it('can render a textarea input', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'textarea',
      },
      ...global,
    })
    expect(wrapper.html()).toContain('<textarea')
  })

  it('renders arbitrary attributes on the textarea element', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'textarea',
        name: 'textarea',
      },
      attrs: {
        id: 'foobar',
        'data-foo': 'bar',
      },
      ...global,
    })
    expect(wrapper.html()).toContain(
      '<textarea data-foo="bar" class="formkit-input" name="textarea" id="foobar"></textarea>'
    )
  })

  it('can v-model its data', async () => {
    const wrapper = mount(
      {
        data() {
          return {
            value: 'bar',
          }
        },
        template: '<FormKit type="textarea" :delay="0" v-model="value" />',
      },
      {
        ...global,
      }
    )
    expect(wrapper.vm.value).toBe('bar')
    const textarea = wrapper.find('textarea')
    await textarea.setValue('baz')
    await textarea.trigger('input')
    await new Promise((r) => setTimeout(r, 5))
    expect(wrapper.vm.value).toBe('baz')
  })
})
