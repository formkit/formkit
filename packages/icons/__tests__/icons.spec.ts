import { createNode } from '@formkit/core'
import { describe, it } from 'vitest'
import { createIconPlugin } from '../src'

describe('icon plugin', () => {
  it('sets the _raw[Icon] prop with direct values', async ({ expect }) => {
    const node = createNode({
      plugins: [createIconPlugin()],
      props: { prefixIcon: '<svg></svg>' },
    })
    expect(node.props._rawPrefixIcon).toBe('<svg></svg>')
  })
  it('will not set the raw icon when unmatched', async ({ expect }) => {
    const node = createNode({
      plugins: [createIconPlugin()],
      props: { prefixIcon: 'star' },
    })
    expect(node.props._rawPrefixIcon).toBe(undefined)
  })
  it('will set the raw icon when matched in the __icons__ prop', async ({
    expect,
  }) => {
    const node = createNode({
      plugins: [createIconPlugin()],
      config: {
        __icons__: {
          star: '<svg><!-- star --></svg>',
        },
      },
      props: { prefixIcon: 'star' },
    })
    expect(node.props._rawPrefixIcon).toBe('<svg><!-- star --></svg>')
  })
})
