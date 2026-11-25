import { getNode } from '@formkit/core'
import { defaultConfig, plugin } from '@formkit/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

// Node 26+ ships its own `localStorage` global, which is undefined unless
// --localstorage-file is set and shadows jsdom's. Restore jsdom's storage.
declare const jsdom: { window: Window } | undefined
if (!globalThis.localStorage && typeof jsdom !== 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: jsdom.window.localStorage,
    configurable: true,
  })
}

describe('localStorage plugin', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('keeps the draft cleared when submitted before the save debounce', async () => {
    vi.useFakeTimers()
    const onSubmit = vi.fn()
    const wrapper = mount(
      {
        setup: () => ({ onSubmit }),
        template: `
          <FormKit type="form" name="submitForm" use-local-storage @submit="onSubmit">
            <FormKit id="submit-name" type="text" name="name" />
          </FormKit>
        `,
      },
      global
    )
    try {
      const storageKey = 'formkit-local-storage-test-submitForm'
      await vi.runAllTimersAsync()
      await getNode('submit-name')!.input('Ada', false)
      await vi.runAllTimersAsync()
      expect(JSON.parse(localStorage.getItem(storageKey) || '{}').data).toEqual({
        name: 'Ada',
      })

      await getNode('submit-name')!.input('Grace', false)
      await wrapper.find('form').trigger('submit')
      expect(onSubmit).toHaveBeenCalledWith(
        { name: 'Grace' },
        expect.anything()
      )
      expect(localStorage.getItem(storageKey)).toBeNull()

      await vi.runAllTimersAsync()
      expect(localStorage.getItem(storageKey)).toBeNull()
    } finally {
      wrapper.unmount()
      vi.useRealTimers()
    }
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
  it('does not save while the control field is off', async () => {
    const wrapper = mount(
      {
        template: `
          <FormKit type="form" name="ctlForm" use-local-storage="true">
            <FormKit type="checkbox" name="remember" :value="false" />
            <FormKit id="ctl-name" type="text" name="name" value="Ada" />
          </FormKit>
        `,
      },
      {
        global: {
          plugins: [
            [
              plugin,
              defaultConfig({
                plugins: [
                  createLocalStoragePlugin({
                    debounce: 0,
                    key: 'local-storage-test',
                    control: 'remember',
                  }),
                ],
              }),
            ],
          ],
        },
      }
    )
    await new Promise((r) => setTimeout(r, 20))
    await getNode('ctl-name')!.input('secret', false)
    await new Promise((r) => setTimeout(r, 20))
    expect(localStorage.getItem('formkit-local-storage-test-ctlForm')).toBeNull()
    wrapper.unmount()
  })
})
