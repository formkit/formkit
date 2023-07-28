import FormKit from '../../src/FormKit'
import { plugin } from '../../src/plugin'
import defaultConfig from '../../src/defaultConfig'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

describe('hidden input', () => {
  it('renders a hidden input without any of the cruft', () => {
    const wrapper = mount(FormKit, {
      props: {
        name: 'bar',
        type: 'hidden',
        id: 'baz',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toBe(
      '<input class="formkit-input" type="hidden" name="bar" id="baz">'
    )
  })
})
