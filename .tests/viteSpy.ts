import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { createCommonJS, resolvePathSync } from 'mlly'
import { resolve } from 'pathe'
import { transform } from 'typescript'
import type { Plugin } from 'vite'

const { __dirname } = createCommonJS(import.meta.url)

/**
 * Gets the transformed source code of a Vue file.
 * @param fileName - The file name — only MyName.vue — don’t include the full path.
 * @returns
 */
export const getTransformedSource = (id: string): string | undefined => {
  const transformedFile = resolvePathSync(
    '../temp/spies/' + id.replaceAll('/', '@'),
    {
      url: import.meta.url,
    }
  )
  return readFileSync(transformedFile, { encoding: 'utf-8' })
}

/**
 * A Vite plugin that spies on the source code of Vue files to know how it has
 * been transformed during the build pipeline. Keep in mind this is technically
 * a memory leak, but should only exist in the context of testing and it will be
 * limited to the number of vue files being imported. The leak should not grow.
 */
export const viteSpy: Plugin = {
  name: 'spy-source',
  transform(code, id) {
    if (id.endsWith('.vue')) {
      const fileName = id.replaceAll('/', '@')
      const dir = resolve(__dirname, '../temp/spies/')
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(resolve(dir, fileName), code, {
        encoding: 'utf-8',
      })
    }
    return null
  },
}
