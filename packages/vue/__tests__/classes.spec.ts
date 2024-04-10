import { mount } from '@vue/test-utils'
import type { FormKitConfig } from '@formkit/core'
import { describe, it, expect } from 'vitest'
import { defaultConfig, plugin } from '../src/index'
import { inject, nextTick } from 'vue'

describe('classes', () => {
  it('updates classes if the underlying config changes', async () => {
    let updateConfig: () => void
    const wrapper = mount(
      {
        setup() {
          const config = inject<FormKitConfig>(Symbol.for('FormKitConfig'))!
          updateConfig = () => {
            config.rootClasses = (section: string) => ({
              [`fizzkit-${section}`]: true,
            })
          }
        },
        template: `<FormKit type="text" label="Test input" />`,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('label').attributes('class')).toBe('formkit-label')
    updateConfig!()
    await nextTick()
    expect(wrapper.find('label').attributes('class')).toBe('fizzkit-label')
  })
})
