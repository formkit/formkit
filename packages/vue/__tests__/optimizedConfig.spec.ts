import { it, expect, describe, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { FormKit, bindings } from '../src'
import { submit, text } from '@formkit/inputs'
import { defineComponent } from 'vue'
import type { FormKitTypeDefinition, FormKitNode } from '@formkit/core'
import { form } from '@formkit/inputs'

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

  it('can inherit the __config__ prop from a parent', () => {
    const wrapper = mount(
      defineComponent({
        components: { FormKit },
        setup() {
          const library = () => false
          library.library = (
            node: FormKitNode
          ): FormKitTypeDefinition | void => {
            if (node.props.type === 'form') return node.define(form)
            if (node.props.type === 'submit') return node.define(submit)
          }
          const config = { plugins: [bindings, library] }
          return { config }
        },
        template: `<FormKit type="form" id="foo" name="myform" :submit-attrs="{ id: 'bar', name: 'bam' }" :__config__="config">Inside the form</FormKit>`,
      })
    )
    expect(wrapper.html()).toMatchInlineSnapshot(`
      "<form class="formkit-form" id="foo" name="myform">Inside the form
        <!---->
        <div class="formkit-actions">
          <div class="formkit-outer" data-family="button" data-type="submit" data-empty="true">
            <!---->
            <div class="formkit-wrapper"><button class="formkit-input" type="submit" name="bam" id="bar">
                <!---->
                <!---->submit
                <!---->
                <!---->
              </button></div>
            <!---->
          </div>
        </div>
      </form>"
    `)
  })
})
