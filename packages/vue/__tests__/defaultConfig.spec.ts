import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { mount } from '@vue/test-utils'
import { FormKitValidationRule } from '@formkit/validation'
import { getNode, FormKitPlugin } from '@formkit/core'
import { token } from '@formkit/utils'
import { jest } from '@jest/globals'

describe('defaultConfig', () => {
  it('allows rule augmentation', async () => {
    const monday: FormKitValidationRule = ({ value }) => value === 'monday'
    mount(FormKit, {
      props: {
        id: 'monday',
        value: 'foobar',
        validation: 'monday',
      },
      global: {
        plugins: [[plugin, defaultConfig({ rules: { monday } })]],
      },
    })
    const node = getNode('monday')!
    expect(node.store).toHaveProperty('rule_monday')
    node.input('monday', false)
    await new Promise((r) => setTimeout(r, 5))
    expect(node.store).not.toHaveProperty('rule_monday')
  })

  it('allows plugin augmentation', async () => {
    const newPlugin: FormKitPlugin = jest.fn((node) =>
      node.hook.input((value) => value + '.')
    )
    mount(FormKit, {
      props: {
        id: 'tuesday',
        value: 'foobar',
      },
      global: {
        plugins: [[plugin, defaultConfig({ plugins: [newPlugin] })]],
      },
    })
    expect(newPlugin).toHaveBeenCalledTimes(1)
    const node = getNode('tuesday')!
    expect(node.value).toBe('foobar.')
  })

  it('allows input augmentation', () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'fooey',
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              inputs: {
                fooey: {
                  type: 'input',
                  schema: [{ $el: 'h1', children: 'Fooey world' }],
                },
              },
            }),
          ],
        ],
      },
    })
    expect(wrapper.html()).toEqual('<h1>Fooey world</h1>')
  })

  it('allows single message overrides', () => {
    const t = token()
    const wrapper = mount(FormKit, {
      props: {
        name: t,
        type: 'text',
        validation: 'required',
        validationVisibility: 'live',
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              messages: {
                en: {
                  validation: {
                    required({ name }) {
                      return `${name} incomplete`
                    },
                  },
                },
              },
            }),
          ],
        ],
      },
    })
    expect(wrapper.find('.formkit-message').text()).toBe(`${t} incomplete`)
  })
})
