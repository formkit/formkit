import FormKitIcon from '../src/FormKitIcon'
import { plugin } from '../src/plugin'
import { defaultConfig } from '../src'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

// const wait = (delay?: number) => new Promise((r) => setTimeout(r, delay ? delay : 0))

describe('FormKitIcon component', () => {
  it('can render an inline svg', () => {
    const wrapper = mount(FormKitIcon, {
      props: {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 7"><path d="M8,6.5c-.13,0-.26-.05-.35-.15L3.15,1.85c-.2-.2-.2-.51,0-.71,.2-.2,.51-.2,.71,0l4.15,4.15L12.15,1.15c.2-.2,.51-.2,.71,0,.2,.2,.2,.51,0,.71l-4.5,4.5c-.1,.1-.23,.15-.35,.15Z" fill="currentColor"/></svg>`,
      },
      global: {
        plugins: [[plugin, defaultConfig]],
      },
    })
    expect(wrapper.html()).toStrictEqual(
      '<span class="formkit-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 7"><path d="M8,6.5c-.13,0-.26-.05-.35-.15L3.15,1.85c-.2-.2-.2-.51,0-.71,.2-.2,.51-.2,.71,0l4.15,4.15L12.15,1.15c.2-.2,.51-.2,.71,0,.2,.2,.2,.51,0,.71l-4.5,4.5c-.1,.1-.23,.15-.35,.15Z" fill="currentColor"></path></svg></span>'
    )
  })

  it('can render an icon from the FormKit icon registry', () => {
    const wrapper = mount(FormKitIcon, {
      props: {
        icon: `libraryIcon`,
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              icons: {
                libraryIcon:
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 7"><path d="M8,6.5c-.13,0-.26-.05-.35-.15L3.15,1.85c-.2-.2-.2-.51,0-.71,.2-.2,.51-.2,.71,0l4.15,4.15L12.15,1.15c.2-.2,.51-.2,.71,0,.2,.2,.2,.51,0,.71l-4.5,4.5c-.1,.1-.23,.15-.35,.15Z" fill="currentColor"/></svg>',
              },
            }),
          ],
        ],
      },
    })
    expect(wrapper.html()).toStrictEqual(
      '<span class="formkit-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 7"><path d="M8,6.5c-.13,0-.26-.05-.35-.15L3.15,1.85c-.2-.2-.2-.51,0-.71,.2-.2,.51-.2,.71,0l4.15,4.15L12.15,1.15c.2-.2,.51-.2,.71,0,.2,.2,.2,.51,0,.71l-4.5,4.5c-.1,.1-.23,.15-.35,.15Z" fill="currentColor"></path></svg></span>'
    )
  })

  it('re-renders its icon when the icon prop changes', async () => {
    const wrapper = mount(FormKitIcon, {
      props: {
        icon: `libraryIcon`,
      },
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              icons: {
                libraryIcon:
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 7"><path d="M8,6.5c-.13,0-.26-.05-.35-.15L3.15,1.85c-.2-.2-.2-.51,0-.71,.2-.2,.51-.2,.71,0l4.15,4.15L12.15,1.15c.2-.2,.51-.2,.71,0,.2,.2,.2,.51,0,.71l-4.5,4.5c-.1,.1-.23,.15-.35,.15Z" fill="currentColor"/></svg>',
                circleIcon:
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle fill="currentColor" cx="16" cy="16" r="16"/></svg>',
              },
            }),
          ],
        ],
      },
    })
    expect(wrapper.html()).toStrictEqual(
      '<span class="formkit-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 7"><path d="M8,6.5c-.13,0-.26-.05-.35-.15L3.15,1.85c-.2-.2-.2-.51,0-.71,.2-.2,.51-.2,.71,0l4.15,4.15L12.15,1.15c.2-.2,.51-.2,.71,0,.2,.2,.2,.51,0,.71l-4.5,4.5c-.1,.1-.23,.15-.35,.15Z" fill="currentColor"></path></svg></span>'
    )
    await wrapper.setProps({ icon: 'circleIcon' })
    expect(wrapper.html()).toStrictEqual(
      '<span class="formkit-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle fill="currentColor" cx="16" cy="16" r="16"></circle></svg></span>'
    )
  })
})
