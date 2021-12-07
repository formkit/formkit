import FormKit from '../src/FormKit'
import { plugin } from '../src/plugin'
import defaultConfig from '../src/defaultConfig'
import { mount } from '@vue/test-utils'
import { FormKitValidationRule } from '@formkit/validation'
import { getNode } from '@formkit/core'

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
})
