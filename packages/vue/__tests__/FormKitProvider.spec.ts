import { FormKit, FormKitProvider, defaultConfig, plugin } from '../src'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FormKitNode } from '@formkit/core'

describe('FormKitProvider', () => {
  it('can use a custom FormKitProvider to automatically inject', async () => {
    const wrapper = mount({
      components: {
        FormKit,
        FormKitProvider,
      },
      methods: {
        defaultConfig,
      },
      template: `
          <FormKitProvider :config="defaultConfig">
            <FormKit type="text" name="foo" />
          </FormKitProvider>
        `,
    })
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('can override a global configuration', () => {
    const wrapper = mount(
      {
        components: {
          FormKit,
          FormKitProvider,
        },
        methods: {
          customConfig() {
            function customLibrary() {}
            customLibrary.library = (node: FormKitNode) => {
              if (node.props.type === 'text') {
                node.define({
                  type: 'input',
                  schema: [
                    {
                      $el: 'h1',
                      children: 'This is a custom text input',
                    },
                  ],
                })
              }
            }
            return {
              plugins: [customLibrary],
            }
          },
        },
        template: `
          <FormKitProvider :config="customConfig">
            <FormKit type="text" name="foo" />
          </FormKitProvider>
        `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.html()).toContain('<h1>This is a custom text input</h1>')
  })
})
