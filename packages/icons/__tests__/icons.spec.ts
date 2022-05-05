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
    expect(node?.context?.iconPrefix).toStrictEqual(`<svg viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">
<path d=\"M8.03548 2L7.95825 2.26248V9.87918L8.03548 9.95627L11.5711 7.8664L8.03548 2Z\" fill=\"currentColor\"/>
<path d=\"M8.03559 2L4.5 7.8664L8.03559 9.9563V6.25938V2Z\" fill=\"currentColor\"/>
<path d=\"M8.0357 11.1066L7.99219 11.1596V13.8729L8.0357 14L11.5734 9.01776L8.0357 11.1066Z\" fill=\"currentColor\"/>
<path d=\"M8.03559 14V11.1066L4.5 9.01776L8.03559 14Z\" fill=\"currentColor\"/>
<path d=\"M8.03564 9.95628L11.5712 7.86643L8.03564 6.25941V9.95628Z\" fill=\"currentColor\"/>
<path d=\"M4.5 7.8664L8.03553 9.95627V6.25938L4.5 7.8664Z\" fill=\"currentColor\"/>
</svg>`)
    expect(node?.context).toHaveProperty('iconSuffix')
    expect(node?.context?.iconSuffix).toStrictEqual(`<svg viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">
<path d=\"M10.9372 0.507507C10.9058 0.471882 9.77503 0.521569 8.79102 1.60625C7.80702 2.69 7.95841 3.93311 7.98056 3.96499C8.00272 3.99686 9.38364 4.04655 10.2652 2.78562C11.1467 1.52469 10.9686 0.544069 10.9372 0.507507ZM13.9963 11.5071C13.952 11.4171 11.8501 10.3503 12.0458 8.29903C12.2415 6.24685 13.592 5.68436 13.6132 5.62342C13.6344 5.56248 13.0621 4.8828 12.4556 4.53874C12.0104 4.29616 11.5176 4.15718 11.0129 4.13186C10.9132 4.12905 10.567 4.0428 9.85533 4.24061C9.38641 4.37092 8.32948 4.7928 8.03871 4.80967C7.74702 4.82655 6.87933 4.3203 5.94609 4.18624C5.34886 4.06905 4.71563 4.30905 4.2624 4.49374C3.81009 4.67749 2.94978 5.20061 2.34793 6.59091C1.74608 7.98028 2.06085 10.1815 2.28609 10.8659C2.51132 11.5493 2.86301 12.6696 3.46117 13.4871C3.99286 14.4096 4.69809 15.0499 4.99255 15.2674C5.28702 15.4849 6.11779 15.6293 6.69379 15.3302C7.15717 15.0415 7.99348 14.8756 8.32395 14.8877C8.65349 14.8999 9.30333 15.0321 9.96887 15.3931C10.496 15.5777 10.9944 15.5009 11.4938 15.2946C11.9932 15.0874 12.716 14.3018 13.5597 12.709C13.88 11.9684 14.0258 11.5681 13.9963 11.5071Z\" fill=\"currentColor\"/>
</svg>`)
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
