import fsp from 'node:fs/promises'
import { join } from 'node:path'
import { defineNuxtConfig } from 'nuxt/config'
import { createResolver } from 'nuxt/kit'
import { createCommonJS } from 'mlly'
import { resolve } from 'pathe'

const { __dirname } = createCommonJS(import.meta.url)
const resolver = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: [
    '@formkit/nuxt',
    '@nuxtjs/tailwindcss',
    // async function alias(_, nuxt) {
    //   nuxt.options.build.transpile.push(
    //     /@formkit/,
    //     /packages\/[^/]*\/(dist|src)/
    //   )

    //   const root = resolver.resolve('../..')
    //   const packages = await fsp.readdir(root)
    //   for (const dir of packages) {
    //     const { name } = await fsp
    //       .readFile(join(root, dir, 'package.json'), 'utf-8')
    //       .then((r) => JSON.parse(r))
    //     nuxt.options.alias[name] = join(root, dir, 'src')
    //   }
    // },
  ],
  formkit: {
    autoImport: 'optimize',
    configFile: resolve(__dirname, 'formkit-optimize.config.ts'),
  },
})
