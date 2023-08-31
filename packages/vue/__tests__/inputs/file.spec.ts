import defaultConfig from '../../src/defaultConfig'
import { plugin } from '../../src/plugin'
import { token } from '@formkit/utils'
import { getNode } from '@formkit/core'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

/**
 * Unfortunately we cannot fully test file inputs due to JSDom limitations.
 */

describe('file inputs', () => {
  it('can rehydrate a file input using an array', () => {
    const id = 'super-unique-id-2'
    const wrapper = mount(
      {
        template: `
        <FormKit
          type="file"
          id="${id}"
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
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('can rehydrate a file from the form', () => {
    const id = 'super-unique-id'
    const wrapper = mount(
      {
        template: `
        <FormKit type="form" id="${id}" :value="{ file: [{ name: 'test.jpg' }] }">
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
    console.log(wrapper.html())
    expect(wrapper.html().replace(/\s\s+/g, '')).toMatchSnapshot()
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

  it('has a default "no files" label', () => {
    const wrapper = mount(
      {
        template: `
          <FormKit
            type="file"
            name="file"
          />
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )

    expect(wrapper.find('.formkit-no-files').exists()).toBe(true)
  })
  it('can be reset to an empty file uploader', async () => {
    const id = token()
    const wrapper = mount(
      {
        template: `
          <FormKit
            id="${id}"
            type="file"
            name="file"
          />
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('.formkit-no-files').exists()).toBe(true)
    getNode(id)!.reset()
    await new Promise((r) => setTimeout(r, 20))
    expect(wrapper.find('.formkit-no-files').exists()).toBe(true)
  })
  it('always renders data-multiple="true" when the multiple attribute exists and is not false', () => {
    const wrapper = mount(
      {
        template: `
          <FormKit
            type="file"
            name="file"
            multiple
          />
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig]],
        },
      }
    )
    expect(wrapper.find('.formkit-outer').attributes('data-multiple')).toBe(
      'true'
    )
  })
})
