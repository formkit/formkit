import {
  FormKit,
  FormKitProvider,
  FormKitLazyProvider,
  defaultConfig,
  plugin,
  createInput,
} from '../src'
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

  it('does not interfere when no config is provided', () => {
    const wrapper = mount(
      {
        components: {
          FormKit,
          FormKitProvider,
        },
        template: `
          <FormKitProvider>
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
    expect(wrapper.find('input.formkit-input').exists()).toBe(true)
  })

  it('can use a custom FormKitLazyProvider to automatically inject a defaultConfig', async () => {
    const wrapper = mount({
      components: {
        FormKit,
        FormKitLazyProvider,
      },
      methods: {
        defaultConfig,
      },
      template: `
          <FormKitLazyProvider>
            <FormKit type="text" name="foo" />
          </FormKitLazyProvider>
        `,
    })
    // Need to provide enough time for the Suspense component to render.
    await new Promise((r) => setTimeout(r, 100))
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('can sub-render a FormKit component that is not registered globally', () => {
    const library = () => {}
    library.library = (node: FormKitNode) => {
      if (node.props.type === 'sub-render') {
        node.define(
          createInput({
            $cmp: 'FormKit',
            props: {
              type: 'child',
            },
          })
        )
      }
      if (node.props.type === 'child') {
        node.define(
          createInput({
            $el: 'h1',
            children: 'I am a child',
          })
        )
      }
    }
    const wrapper = mount({
      components: {
        FormKit,
        FormKitProvider,
      },
      data() {
        return {
          config: {
            plugins: [library],
          },
        }
      },
      template: `
          <FormKitProvider :config="config">
            <FormKit type="sub-render" />
          </FormKitProvider>
        `,
    })
    expect(wrapper.find('h1').text()).toBe('I am a child')
  })
})
