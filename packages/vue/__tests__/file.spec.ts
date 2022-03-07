import defaultConfig from '../src/defaultConfig'
import { plugin } from '../src/plugin'
import { mount } from '@vue/test-utils'

/**
 * Unfortunately we cannot fully test file inputs due to JSDom limitations.
 */

describe('file inputs', () => {
  it('can rehydrate a file input using an array', () => {
    const wrapper = mount(
      {
        template: `
        <FormKit
          type="file"
          :value="[
            { name: 'test.pdf' }
          ]"
        />
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.html()).toContain(
      '<li class="formkit-file-item"><span class="formkit-file-name">test.pdf</span><a href="#" class="formkit-remove-files">Remove</a></li>'
    )
  })

  it('can rehydrate a file from the form', () => {
    const wrapper = mount(
      {
        template: `
        <FormKit type="form" :value="{ file: [{ name: 'test.jpg' }] }">
          <FormKit
            type="file"
            name="file"
          />
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.html()).toContain(
      '<li class="formkit-file-item"><span class="formkit-file-name">test.jpg</span><a href="#" class="formkit-remove-files">Remove</a></li>'
    )
  })

  it('can override the class for a file’s name', () => {
    const wrapper = mount(
      {
        template: `
          <FormKit
            type="file"
            name="file"
            :value="[{ name: 'test.jpg' }]"
            file-name-class="my-name"
          />
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    const fileName = wrapper.find('.formkit-file-name')
    expect(fileName.exists()).toBe(true)
    expect(fileName.attributes('class')).toContain('my-name')
  })
})
