import { createOpts } from '../../src/utils/config'
import type { Options } from '../../src/types'
import { createTransform } from '../../src/hooks/transform'
import { createContext } from '../mocks/context'
import vuePlugin from '@vitejs/plugin-vue'
import * as vueCompiler from 'vue/compiler-sfc'
import { readFile } from 'fs/promises'
import esbuild from 'esbuild'

const NOT_INLINED_SFC = /import _sfc_main from ".*?\?(vue&.*?)"/

export async function sfcTransform(id: string, options: Partial<Options> = {}) {
  const opts = await createOpts(options)
  const context = createContext(opts)
  const transform = createTransform(opts)
  const vue = vuePlugin({ compiler: vueCompiler })
  const sfcCode = await getCode(vue, context, id)
  const result = await transform.apply(context, [sfcCode, id])
  if (!result) return null
  if (typeof result === 'string') return result
  return result.code
}

export async function getCode(
  vue: ReturnType<typeof vuePlugin>,
  context: ReturnType<typeof createContext>,
  id: string,
  query?: string
) {
  const idWithQuery = `${id}${query ? `?${query}` : ''}`
  let code = ''
  if (query && typeof vue.load === 'function') {
    const result = await vue.load.apply(context as any, [idWithQuery])
    if (typeof result === 'string') {
      code = result
    } else if (result && typeof result.code === 'string') {
      code = result.code
    }
  } else {
    code = await readFile(id, 'utf-8')
  }
  if (typeof vue.transform === 'function') {
    const transformed = await vue.transform.apply(context as any, [code, id])
    if (transformed) {
      if (typeof transformed === 'string') {
        code = transformed
      } else if (typeof transformed.code === 'string') {
        code = transformed.code
      }
    }
    if (NOT_INLINED_SFC.test(code)) {
      const match = code.match(NOT_INLINED_SFC)
      if (match) {
        code = await getCode(vue, context, id, match[1])
      }
    }
  }
  return esbuild.transformSync(code, {
    loader: 'ts',
  }).code
}
