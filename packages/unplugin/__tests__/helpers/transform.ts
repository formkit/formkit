import { createOpts } from '../../src/utils/config'
import type { Options } from '../../src/types'
import { createTransform } from '../../src/hooks/transform'
import { createContext } from '../mocks/context'
import vuePlugin from '@vitejs/plugin-vue'
import * as vueCompiler from 'vue/compiler-sfc'
import { readFile } from 'fs/promises'

export async function sfcTransform(id: string, options: Partial<Options> = {}) {
  let sfcCode = await readFile(id, { encoding: 'utf-8' })
  const opts = createOpts(options)
  const context = createContext(opts)
  const transform = createTransform(opts)
  const vue = vuePlugin({ compiler: vueCompiler })
  if (typeof vue.transform === 'function') {
    const transformed = await vue.transform.apply(context as any, [sfcCode, id])
    if (transformed) {
      if (typeof transformed === 'string') {
        sfcCode = transformed
      } else if (typeof transformed.code === 'string') {
        sfcCode = transformed.code
      }
    }
  }
  const result = await transform.apply(context, [sfcCode, id])
  if (!result) return null
  if (typeof result === 'string') return result
  return result.code
}
