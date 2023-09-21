import { plugin } from '../../src/plugin'
import { defaultConfig } from '../../src/defaultConfig'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const global: Record<string, Record<string, any>> = {
  global: {
    plugins: [[plugin, defaultConfig]],
  },
}

describe('meta inputs', () => {
  it('It passes value through the form', async () => {
    const submitHandler = vi.fn()
    const wrapper = mount(
      {
        methods: {
          submitHandler,
        },
        data() {
          return {
            formData: {
              meta_input: {
                trainsPlainsAndArrays: [1, 2, 3],
              },
              text_input: 'Hello World',
            },
          }
        },
        template: `<FormKit type="form" :value="formData" id="form" @submit="submitHandler">
        <FormKit type="meta" name="meta_input" />
        <FormKit type="text" name="text_input" />
      </FormKit>`,
      },
      global
    )
    await new Promise((r) => setTimeout(r, 15))
    wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 15))
    expect(submitHandler.mock.calls[0][0]).toEqual({
      meta_input: {
        trainsPlainsAndArrays: [1, 2, 3],
      },
      text_input: 'Hello World',
    })
  })
})
