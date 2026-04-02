// @vitest-environment node

import { getNode } from '@formkit/core'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  createPlugin,
  FormKit,
  FormKitProvider,
  defaultConfig,
  ssrComplete,
} from '../src'

describe('react SSR cleanup', () => {
  it('releases FormKit nodes after ssrComplete', () => {
    const config = createPlugin(defaultConfig()).options

    renderToString(
      createElement(
        FormKitProvider,
        { config },
        createElement(FormKit as any, {
          type: 'text',
          id: 'react-ssr-cleanup',
          name: 'name',
        })
      )
    )

    expect(Boolean(getNode('react-ssr-cleanup'))).toBe(true)

    ssrComplete(config)

    expect(Boolean(getNode('react-ssr-cleanup'))).toBe(false)
  })
})
