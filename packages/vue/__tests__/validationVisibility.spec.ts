import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { plugin, defaultConfig, FormKit } from '../src'
import { getNode } from '@formkit/core'

const global = { global: { plugins: [[plugin, defaultConfig]] } } as any

describe('combined validation-visibility (#973)', () => {
  const setup = () => {
    const wrapper = mount(FormKit, {
      props: {
        id: 'vv',
        type: 'text',
        validation: 'required|length:5',
        validationVisibility: 'blur dirty',
        delay: 0,
      },
      ...global,
    })
    return { wrapper, node: () => getNode('vv')! }
  }

  it('shows required when tabbing out of an empty input (blur)', async () => {
    const { wrapper, node } = setup()
    await flushPromises()
    expect(node().context!.state.validationVisible).toBe(false)
    await wrapper.find('input').trigger('blur')
    await flushPromises()
    expect(node().context!.state.validationVisible).toBe(true)
    expect(wrapper.text()).toContain('required')
  })

  it('shows rules live once the user types (dirty), before any blur', async () => {
    const { wrapper, node } = setup()
    await flushPromises()
    await wrapper.find('input').setValue('ab')
    await new Promise((r) => setTimeout(r, 20))
    await flushPromises()
    expect(node().context!.state.blurred).toBe(false)
    expect(node().context!.state.validationVisible).toBe(true)
    expect(wrapper.text()).toContain('5 characters')
  })

  it('single modes are unchanged', async () => {
    const wrapper = mount(FormKit, {
      props: { id: 'vv2', type: 'text', validation: 'required', validationVisibility: 'dirty', delay: 0 },
      ...global,
    })
    await flushPromises()
    await wrapper.find('input').trigger('blur')
    await flushPromises()
    expect(getNode('vv2')!.context!.state.validationVisible).toBe(false)
  })
})
