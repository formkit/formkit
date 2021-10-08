import FormKit from '../FormKit'
import { plugin } from '../plugin'
import defaultConfig from '../defaultConfig'
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
      '<input type="text" name="food" id="foobar" placeholder="Favorite food?">'
    )
  })
})
