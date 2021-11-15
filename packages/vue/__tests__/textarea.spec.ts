import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { mount } from '@vue/test-utils'

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
    expect(wrapper.html()).toContain('<textarea type="textarea"')
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
      '<textarea data-foo="bar" type="textarea" class="formkit-input" name="textarea" id="foobar"></textarea>'
    )
  })
})
