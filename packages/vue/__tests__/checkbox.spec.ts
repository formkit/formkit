import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { mount } from '@vue/test-utils'

const global: Record<string, Record<string, any>> = {
  global: {
    plugins: [[plugin, defaultConfig]],
  },
}

describe('checkboxes', () => {
  it('can render a single checkbox', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'checkbox',
      },
      ...global,
    })
    expect(wrapper.html()).toContain('<input type="checkbox"')
  })
})
