import FormKit from '../../src/FormKit'
import FormKitIcon from '../../src/FormKitIcon'
import { plugin } from '../../src/plugin'
import { defaultConfig } from '../../src'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

describe('checkbox icons', () => {
  it('loads its default decorator icon with a custom iconLoader (#1301)', async () => {
    const iconLoader = vi.fn((iconName: string) => {
      return `<svg data-loaded-icon="${iconName}" viewBox="0 0 1 1"></svg>`
    })
    const wrapper = mount(FormKit, {
      props: {
        type: 'checkbox',
      },
      global: {
        plugins: [[plugin, defaultConfig({ iconLoader })]],
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(iconLoader).toHaveBeenCalledWith('checkboxDecorator')
    expect(
      wrapper.find('svg[data-loaded-icon="checkboxDecorator"]').exists()
    ).toBe(true)
  })

  it('does not let an unresolved default icon block later custom loading (#1301)', async () => {
    mount(FormKitIcon, {
      props: {
        icon: 'default:formkit1301Missing',
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    await new Promise((resolve) => setTimeout(resolve, 10))

    const iconLoader = vi.fn((iconName: string) => {
      return `<svg data-loaded-icon="${iconName}" viewBox="0 0 1 1"></svg>`
    })
    const wrapper = mount(FormKitIcon, {
      props: {
        icon: 'formkit1301Missing',
      },
      global: {
        plugins: [[plugin, defaultConfig({ iconLoader })]],
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(iconLoader).toHaveBeenCalledWith('formkit1301Missing')
    expect(
      wrapper.find('svg[data-loaded-icon="formkit1301Missing"]').exists()
    ).toBe(true)
  })
})
