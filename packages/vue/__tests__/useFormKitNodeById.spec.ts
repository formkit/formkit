import { describe, it, expect } from 'vitest'
import {
  plugin,
  FormKit,
  defaultConfig,
  useFormKitNodeById,
} from '../src/index'
import { token } from '@formkit/utils'
import { h, Component, defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import type { FormKitNode } from '@formkit/core'

const ChildComponent = defineComponent({
  setup() {
    return () =>
      h('div', [
        h(FormKit as Component, { name: 'child', value: 'initial-value' }),
      ])
  },
})

describe('useFormKitContextById', () => {
  it('fetches the value outside the form', async () => {
    const a = `a${token()}`
    const b = `b${token()}`
    const wrapper = mount(
      {
        setup() {
          const sum = ref(0)
          const add = (node: FormKitNode<string>) => {
            sum.value += Number(node.value)
          }
          useFormKitNodeById<string>(a, add)
          useFormKitNodeById<string>(b, add)
          return { sum }
        },
        components: {
          ChildComponent,
        },
        template: `
        <pre id="sum">{{ sum }}</pre>
        <FormKit type="form">
          <FormKit type="text" id="${a}" value="3" />
          <FormKit type="text" id="${b}" value="5" />
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
    expect(wrapper.find('#sum').text()).toBe('0')
    await nextTick()
    expect(wrapper.find('#sum').text()).toBe('8')
  })
})
