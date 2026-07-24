// @vitest-environment node

import { getNode } from '@formkit/core'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { defaultConfig, FormKit, plugin, ssrComplete } from '../src'

describe('vue SSR cleanup', () => {
  it('releases component-based FormKit nodes after ssrComplete', async () => {
    const componentInput = {
      type: 'input' as const,
      component: defineComponent({
        render: () => h('input'),
      }),
    }
    const app = createSSRApp({
      render: () =>
        h(FormKit, {
          type: 'componentInput',
          id: 'vue-ssr-cleanup-input',
        }),
    })
    app.use(plugin, defaultConfig({ inputs: { componentInput } }))

    await renderToString(app)

    expect(Boolean(getNode('vue-ssr-cleanup-input'))).toBe(true)

    ssrComplete(app)

    expect(Boolean(getNode('vue-ssr-cleanup-input'))).toBe(false)
  })
})
