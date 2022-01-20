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
      '<li class="formkit-file-item"><span>test.pdf</span><a href="#" class="formkit-remove-files">Remove</a></li>'
    )
  })
})
