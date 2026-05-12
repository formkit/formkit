import { getNode } from '@formkit/core'
import { defaultConfig, plugin } from '@formkit/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createLocalStoragePlugin } from '../src/plugins/localStoragePlugin'

const global = {
  global: {
    plugins: [
      [
        plugin,
        defaultConfig({
          plugins: [
            createLocalStoragePlugin({
              debounce: 0,
              key: 'local-storage-test',
            }),
          ],
        }),
      ],
    ],
  },
}

describe('localStorage plugin', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('does not save file input values (#1363)', async () => {
    const wrapper = mount(
      {
        template: `
          <FormKit type="form" name="resumeForm" use-local-storage>
            <FormKit type="text" name="name" value="Ada" />
            <FormKit id="attachment-save" type="file" name="attachment" />
          </FormKit>
        `,
      },
      global
    )
    await new Promise((r) => setTimeout(r, 10))
    await getNode('attachment-save')!.input(
      [
        {
          name: 'resume.pdf',
          file: new File(['resume'], 'resume.pdf'),
        },
      ],
      false
    )
    await new Promise((r) => setTimeout(r, 10))
    const stored = JSON.parse(
      localStorage.getItem('formkit-local-storage-test-resumeForm') || '{}'
    )
    expect(stored.data).toEqual({ name: 'Ada' })
    wrapper.unmount()
  })

  it('does not load stale cached file input values (#1363)', async () => {
    localStorage.setItem(
      'formkit-local-storage-test-uploadForm',
      JSON.stringify({
        maxAge: Date.now() + 1000,
        data: {
          name: 'Ada',
          attachment: [{ name: 'resume.pdf' }],
        },
      })
    )
    const wrapper = mount(
      {
        template: `
          <FormKit type="form" name="uploadForm" use-local-storage>
            <FormKit type="text" name="name" />
            <FormKit id="attachment-load" type="file" name="attachment" />
          </FormKit>
        `,
      },
      global
    )
    await new Promise((r) => setTimeout(r, 10))
    expect(getNode('attachment-load')!.value).toEqual([])
    expect(wrapper.find('.formkit-file-name').exists()).toBe(false)
    wrapper.unmount()
  })
})
