import { FormKitNode, getNode } from '@formkit/core'
import { token } from '@formkit/utils'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { defaultConfig, FormKit, plugin } from '../src'

describe('plugins', () => {
  it('can define props in a standard plugin', () => {
    const customPlugin = (node: FormKitNode) => {
      node.addProps(['fooBar'])
      expect(node.props.fooBar).toBe('123')
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

  it('can add props after the node as already been created', async () => {
    const id = token()
    const customPlugin = (node: FormKitNode) => {
      node.addProps(['fooBar'])
      expect(node.props.fooBar).toBe('123')
    }
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        id,
        'foo-bar': '123',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.find('[foo-bar]').exists()).toBe(true)
    getNode(id)?.use(customPlugin)
    await nextTick()
    expect(wrapper.find('[foo-bar]').exists()).toBe(false)
  })
})
