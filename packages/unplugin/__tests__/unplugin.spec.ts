import { describe, it } from 'vitest'
// import { getTransformedSource } from '../../../.tests/viteSpy'
// import { resolvePathSync } from 'mlly'
// import { mount } from '@vue/test-utils'
import { createOpts } from '../src/utils/config'
import type { Options } from '../src/types'
import { createTransform } from '../src/hooks/transform'
import SimpleRender from './fixtures/SimpleRender.vue?raw'
import { createContext } from './mocks/context'
// import vuePlugin from '@vitejs/plugin-vue'

async function transform(
  code: string,
  id: string,
  options: Partial<Options> = {}
) {
  const opts = createOpts(options)
  const context = createContext(opts)
  const transform = createTransform(opts)
  // const vue = vuePlugin()
  // if (typeof vue.transform === 'function') {
  // const transformed = await vue.transform.apply(context as any, [code, id])
  // if (transformed) {
  //   if (typeof transformed === 'string') {
  //     code = transformed
  //   } else if (typeof transformed.code === 'string') {
  //     code = transformed.code
  //   }
  // }
  // }
  return transform.apply(context, [code, id])
}

describe('vite plugin transform', () => {
  it('has transformed the code', async ({ expect }) => {
    const transformedSource = await transform(
      SimpleRender,
      './SimpleRender.vue'
    )
    expect(transformedSource).toBe('foobar')
  })
})
