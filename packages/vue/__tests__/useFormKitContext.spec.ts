import { describe, it, expect, vi } from 'vitest'
import { plugin, FormKit, defaultConfig, useFormKitContext } from '../src/index'
import type { Component } from 'vue'
import { h, nextTick, defineComponent } from 'vue'
import { mount } from '@vue/test-utils'

const ChildComponent = defineComponent({
  props: {
    address: String,
  },
  setup(props) {
    const ctx = useFormKitContext<any>(props.address)
    return () =>
      h('div', [
        h('p', { id: 'inner-target' }, JSON.stringify(ctx.value?.value)),
        h(FormKit as Component, { name: 'child', value: 'initial-value' }),
      ])
  },
})

describe('useFormKitContext', () => {
  it('renders the child value inside the form', async () => {
    const wrapper = mount(
      {
        setup() {
          const ctx = useFormKitContext()
          return { ctx }
        },
        components: {
          ChildComponent,
        },
        template: `
        <pre id="outer-target">{{ ctx?.value.name }}</pre>
        <FormKit type="form">
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
    expect(wrapper.find('#inner-target').text()).toBe('{"name":"Mr. FormKit"}')
  })

  it('renders the child before the child inside the form', async () => {
    const wrapper = mount(
      {
        setup() {
          const ctx = useFormKitContext()
          return { ctx }
        },
        components: {
          ChildComponent,
        },
        template: `
        <pre id="outer-target">{{ ctx?.value.name }}</pre>
        <FormKit type="form">
          <ChildComponent />
          <FormKit type="text" name="name" value="Mr. FormKit" />
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    // Initially the value cannot be there
    expect(wrapper.find('#inner-target').text()).toBe('{}')
    await nextTick()
    // After the first paint it is there when the ref is populated
    expect(wrapper.find('#inner-target').text()).toBe(
      '{"child":"initial-value","name":"Mr. FormKit"}'
    )
  })

  it('traverses to sibling and renders its value', async () => {
    const wrapper = mount(
      {
        setup() {
          const ctx = useFormKitContext()
          return { ctx }
        },
        components: {
          ChildComponent,
        },
        template: `
        <pre id="outer-target">{{ ctx?.value.name }}</pre>
        <FormKit type="form">
          <ChildComponent address="child" />
          <FormKit type="text" name="name" value="Mr. FormKit" />
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    // Initially the value cannot be there
    expect(wrapper.find('#inner-target').text()).toBe('')
    await nextTick()
    // After the first paint it is there when the ref is populated
    expect(wrapper.find('#inner-target').text()).toBe('"initial-value"')
  })

  it('calls the effect callback immediately when the context is already there', async () => {
    const effect = vi.fn()
    mount(
      {
        components: {
          ChildImmediate: defineComponent({
            setup() {
              const ctx = useFormKitContext(effect)
              return { ctx }
            },
            template: `<FormKit type="text" name="name" value="Mr. FormKit" />`,
          }),
        },
        template: `
        <FormKit type="form">
          <ChildImmediate />
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    expect(effect).toHaveBeenCalled()
  })

  it('calls the effect callback later when the context is available', async () => {
    const effect = vi.fn()
    mount(
      {
        components: {
          ChildImmediate: defineComponent({
            setup() {
              const ctx = useFormKitContext('later', effect)
              return { ctx }
            },
            template: `<FormKit type="text" name="name" value="Mr. FormKit" />`,
          }),
        },
        template: `
        <FormKit type="form">
          <ChildImmediate />
          <FormKit type="text" name="later" value="Mr. FormKit" />
        </FormKit>
      `,
      },
      {
        global: {
          plugins: [[plugin, defaultConfig()]],
        },
      }
    )
    expect(effect).toHaveBeenCalled()
  })
})
