import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { mount } from '@vue/test-utils'

describe('text classification', () => {
  it('can render a text input', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toContain('<input type="text"')
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
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toContain(
      '<input type="text" class="formkit-input" name="food" id="foobar" placeholder="Favorite food?">'
    )
  })
})
