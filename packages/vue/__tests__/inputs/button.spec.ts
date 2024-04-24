import { describe, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { de } from '@formkit/i18n'
import { plugin, defaultConfig } from '../../src/index'

describe('button', () => {
  it('should localize the button', ({ expect }) => {
    const wrapper = mount(
      {
        template: `<FormKit type="button" />`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig({ locale: 'de', locales: { de } })]],
        },
      }
    )
    expect(wrapper.text()).toBe('Senden')
  })
})
