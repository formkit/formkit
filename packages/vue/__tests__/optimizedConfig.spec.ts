import { it, expect, describe, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { FormKit, bindings } from '../src'
import { text } from '@formkit/inputs'
import { defineComponent } from 'vue'
import type { FormKitTypeDefinition, FormKitNode } from '@formkit/core'

describe('optimizedConfig', () => {
  it('can use the __config__ prop to boot a simple input', () => {
    const userLand = vi.fn()
    const wrapper = mount(
      defineComponent({
        components: { FormKit },
        setup() {
          const library = () => {}
          library.library = (
            node: FormKitNode
          ): FormKitTypeDefinition | void => {
            if (node.props.type === 'text') node.define(text)
          }
          const config = { plugins: [bindings, library] }
          return { config, text, bindings, userLand }
        },
        template: `<FormKit :__config__="config" :plugins="[userLand]" />`,
      })
    )
    expect(wrapper.find('input').exists()).toBe(true)
    expect(userLand).toHaveBeenCalledTimes(1)
  })
})
