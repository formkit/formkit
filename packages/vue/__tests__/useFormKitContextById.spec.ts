import { describe, it, expect } from 'vitest'
import {
  plugin,
  FormKit,
  defaultConfig,
  useFormKitContextById,
} from '../src/index'
import { token } from '@formkit/utils'
import { h, Component, defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

const ChildComponent = defineComponent({
  setup() {
    return () =>
      h('div', [
        h(FormKit as Component, { name: 'child', value: 'initial-value' }),
      ])
  },
})

describe('useFormKitContextById', () => {
  it('renders the value outside the form', async () => {
    const id = `a${token()}`
    const wrapper = mount(
      {
        setup() {
          const ctx = useFormKitContextById(id)
          return { ctx }
        },
        components: {
          ChildComponent,
        },
        template: `
        <pre id="outer-target">{{ ctx?.value }}</pre>
        <FormKit type="form" id="${id}">
          <FormKit type="text" name="name" value="Mr. FormKit" />
          <ChildComponent />
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    expect(wrapper.find('#outer-target').text()).toBe('')
    await nextTick()
    expect(wrapper.find('#outer-target').text()).toBe(`{
  "name": "Mr. FormKit",
  "child": "initial-value"
}`)
  })

  it('renders the value from inside the form', async () => {
    const id = `a${token()}`
    const wrapper = mount(
      {
        components: {
          Child: defineComponent({
            setup() {
              const ctx = useFormKitContextById(id)
              return () =>
                h('div', { id: 'parent-value' }, [
                  JSON.stringify(ctx.value?.value),
                  h(FormKit as Component, {
                    name: 'child',
                    value: 'initial-value',
                  }),
                ])
            },
          }),
        },
        template: `
        <FormKit type="form" id="${id}">
          <FormKit type="text" name="name" value="Mrs. FormKit" />
          <Child />
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    expect(wrapper.find('#parent-value').text()).toBe('{"name":"Mrs. FormKit"}')
    await nextTick()
    expect(wrapper.find('#parent-value').text()).toBe(
      `{"name":"Mrs. FormKit","child":"initial-value"}`
    )
  })
})
