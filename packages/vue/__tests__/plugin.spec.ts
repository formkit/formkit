import { FormKitNode } from '@formkit/core'
import { mount } from '@vue/test-utils'
import { defaultConfig, FormKit, plugin } from '../src'

describe('plugins', () => {
  it('can define props in a standard plugin', () => {
    const customPlugin = (node: FormKitNode) => {
      node.addProps(['fooBar'])
    }
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        'foo-bar': '123',
        plugins: [customPlugin],
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('[foo-bar]').exists()).toBe(false)
  })
})
