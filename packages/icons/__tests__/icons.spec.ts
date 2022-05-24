import { createIconPlugin, inputIcons, ethereum, apple } from '../src'
import { createNode, getNode, FormKitNode } from '@formkit/core'
import { plugin as vuePlugin, FormKit, defaultConfig } from '@formkit/vue'
import { mount } from '@vue/test-utils'
import { jest } from '@jest/globals'

const nextTick = () => new Promise((r) => setTimeout(r, 0))
const iconPlugin = createIconPlugin({
  ...inputIcons,
  ethereum,
  apple,
  customSVG: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M329.6 176H488C498.3 176 507.4 182.5 510.7 192.2C514 201.9 510.8 212.6 502.7 218.9L371.9 320.7L422.9 480.7C426.1 490.7 422.4 501.7 413.7 507.7C405.1 513.7 393.6 513.4 385.3 506.9L256 406.4L126.7 506.9C118.4 513.4 106.9 513.7 98.27 507.7C89.65 501.7 85.94 490.7 89.13 480.7L140.1 320.7L9.267 218.9C1.174 212.6-2.027 201.9 1.3 192.2C4.628 182.5 13.75 176 24 176H182.5L233.1 16.72C236.3 6.764 245.6 0 256 0C266.5 0 275.7 6.764 278.9 16.72L329.6 176z"/></svg>'
})

describe('icon plugin', () => {
  it('defaults to the prefix icon slot', async () => {
    const node = createNode({
      plugins: [iconPlugin],
      props: {
        type: 'text',
        icon: 'text'
      }
    })
    await nextTick()
    expect(node.props).toHaveProperty('iconPrefix')
  })
})

describe('Vue: icon plugin', () => {
  it('it can change the default icon position via global config', () => {
    mount(FormKit, {
      props: {
        id: 'hasIcon',
        icon: 'ethereum'
      },
      global: {
        plugins: [
          [vuePlugin, defaultConfig({
            config: {
              iconPosition: 'suffix'
            },
            plugins: [iconPlugin]
          })]
        ],
      }
    })
    const node = getNode('hasIcon')!
    expect(node.props).toHaveProperty('iconSuffix')
  })

  it('can have icons in both suffix and prefix slots', () => {
    mount(FormKit, {
      props: {
        id: 'hasIcon',
        iconPrefix: 'ethereum',
        iconSuffix: 'apple'
      },
      global: {
        plugins: [
          [vuePlugin, defaultConfig({
            plugins: [iconPlugin]
          })]
        ]
      }
    })
    const node = getNode('hasIcon')!
    expect(node?.context).toHaveProperty('iconPrefix')
    expect(node?.context?.iconPrefix).toStrictEqual(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 16"><path d="M5,1l-.09,.31V10.19l.09,.09,4-2.44L5,1Z" fill="currentColor"/><path d="M5,1L1,7.84l4,2.44V1Z" fill="currentColor"/><path d="M5,11.62l-.05,.06v3.17l.05,.15,4-5.81-4,2.44Z" fill="currentColor"/><path d="M5,15v-3.38l-4-2.44,4,5.81Z" fill="currentColor"/><path d="M5,10.28l4-2.44-4-1.87v4.31Z" fill="currentColor"/><path d="M1,7.84l4,2.44V5.97l-4,1.87Z" fill="currentColor"/></svg>`)
    expect(node?.context).toHaveProperty('iconSuffix')
    expect(node?.context?.iconSuffix).toStrictEqual(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M10.74,1.01s-1.08,.01-2,1.03c-.92,1.01-.78,2.17-.76,2.2,.02,.03,1.31,.08,2.13-1.1,.82-1.18,.66-2.09,.63-2.13Zm2.86,10.27c-.04-.08-2-1.08-1.82-2.99,.18-1.92,1.44-2.44,1.46-2.5,.02-.06-.51-.69-1.08-1.01-.42-.23-.88-.36-1.35-.38-.09,0-.42-.08-1.08,.1-.44,.12-1.42,.52-1.7,.53-.27,.02-1.08-.46-1.95-.58-.56-.11-1.15,.11-1.57,.29-.42,.17-1.23,.66-1.79,1.96-.56,1.3-.27,3.35-.06,3.99,.21,.64,.54,1.68,1.1,2.45,.5,.86,1.15,1.46,1.43,1.66,.27,.2,1.05,.34,1.59,.06,.43-.27,1.21-.42,1.52-.41,.31,.01,.91,.13,1.54,.47,.49,.17,.96,.1,1.42-.09,.47-.19,1.14-.93,1.93-2.41,.3-.69,.44-1.06,.41-1.12Z" fill="currentColor"/></svg>`)
  })

  it('can register an icon click handler', () => {
    const prefixClickHandler = jest.fn()
    const suffixClickHandler = jest.fn()
    const iconClickHandler = (_node: FormKitNode, sectionKey: string) => {
      if (sectionKey === 'prefix') {
        prefixClickHandler()
      } else {
        suffixClickHandler()
      }
    }
    const wrapper = mount(FormKit, {
      props: {
        id: 'hasIcon',
        iconPrefix: 'ethereum',
        iconSuffix: 'apple',
        onIconClick: iconClickHandler
      },
      global: {
        plugins: [
          [vuePlugin, defaultConfig({
            plugins: [iconPlugin]
          })]
        ]
      }
    })
    wrapper.find('.formkit-icon.formkit-prefix').trigger('click')
    expect(prefixClickHandler).toHaveBeenCalledTimes(1)
    expect(suffixClickHandler).toHaveBeenCalledTimes(0)
    wrapper.find('.formkit-icon.formkit-suffix').trigger('click')
    expect(prefixClickHandler).toHaveBeenCalledTimes(1)
    expect(suffixClickHandler).toHaveBeenCalledTimes(1)
  })
})
