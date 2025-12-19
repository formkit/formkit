import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { FormKit, plugin, defaultConfig, resetCount } from '@formkit/vue'
import { createFloatingLabelsPlugin } from '../src/plugins/floatingLabels/floatingLabelsPlugin'
import { FormKitNode, FormKitPlugin, FormKitSectionsSchema } from '@formkit/core'
import { clone } from '@formkit/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

/**
 * A test plugin that adds a custom data attribute to the outer section.
 * Used to verify that the floating labels plugin merges with existing attributes.
 */
function createTestAttributePlugin(): FormKitPlugin {
  return (node: FormKitNode) => {
    node.on('created', () => {
      if (!node.props || !node.props.definition) return

      const inputDefinition = clone(node.props.definition)
      const originalSchema = inputDefinition.schema
      if (typeof originalSchema !== 'function') return

      const higherOrderSchema = (extensions: FormKitSectionsSchema) => {
        extensions.outer = {
          attrs: {
            'data-test-plugin': 'true',
          },
        }
        return originalSchema(extensions)
      }

      inputDefinition.schema = higherOrderSchema
      if (inputDefinition.schemaMemoKey) {
        inputDefinition.schemaMemoKey += '-test-plugin'
      }
      node.props.definition = inputDefinition
    })
  }
}

describe('floatingLabels', () => {
  beforeEach(() => {
    resetCount()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('can mount a text input with floating labels', async () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        label: 'Test Label',
        floatingLabel: true,
      },
      attachTo: document.body,
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              plugins: [createFloatingLabelsPlugin()],
            }),
          ],
        ],
      },
    })

    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.html()).toContain('data-floating-label="true"')
    wrapper.unmount()
  })

  it('merges with existing attributes from other plugins', async () => {
    // Plugin registration order determines schema execution order:
    // Plugins registered FIRST run LATER in the schema chain.
    // So if we want floating labels to merge with existing attrs,
    // floating labels must be registered FIRST (so it runs after the other plugin).
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        label: 'Test Label',
        floatingLabel: true,
      },
      attachTo: document.body,
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              plugins: [
                // Floating labels registered first -> runs later in schema chain
                // So it will see the attrs set by testPlugin and merge with them
                createFloatingLabelsPlugin(),
                // Test plugin registered second -> runs first in schema chain
                createTestAttributePlugin(),
              ],
            }),
          ],
        ],
      },
    })

    await new Promise((r) => setTimeout(r, 10))
    const html = wrapper.html()

    // Both attributes should be present - floating labels merged with test plugin's attrs
    expect(html).toContain('data-floating-label="true"')
    expect(html).toContain('data-test-plugin="true"')
    wrapper.unmount()
  })

  it('applies floating labels when useAsDefault is true', async () => {
    const wrapper = mount(FormKit, {
      props: {
        type: 'text',
        label: 'Test Label',
      },
      attachTo: document.body,
      global: {
        plugins: [
          [
            plugin,
            defaultConfig({
              plugins: [createFloatingLabelsPlugin({ useAsDefault: true })],
            }),
          ],
        ],
      },
    })

    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.html()).toContain('data-floating-label="true"')
    wrapper.unmount()
  })
})
