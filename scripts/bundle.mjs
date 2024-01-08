/* @ts-check */
import { build } from 'tsup'
import { resolve, dirname } from 'pathe'
import { fileURLToPath } from 'url'
import { readdirSync } from 'fs'
import { readFileSync } from 'fs'
import { replace } from 'esbuild-plugin-replace'
import { progress } from './build.mjs'

const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
    let filter = /^[^./]|^\.[^./]|^\.\.[^/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, (args) => ({ path: args.path, external: true }))
  },
}

/**
 * Create a new bundle of a certain format for a certain package.
 * @param {string} pkg the package to create a bundle for
 * @param {string} format the format to create (cjs, esm, umd, etc...)
 */
export async function createBundle(pkg, plugin) {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const rootDir = resolve(__dirname, `../packages/${pkg}`)
  const packages = readdirSync(resolve(__dirname, '../packages')).filter(
    (p) => !p.startsWith('.')
  )

  const tsconfig = JSON.parse(
    readFileSync(resolve(__dirname, '../tsconfig.json'), 'utf8')
  )
  if (!pkg) {
    console.log('package is:', pkg)
    throw new Error('PKG env var is required to build.')
  }

  if (!packages.includes(pkg)) {
    throw new Error(`${pkg} is not a valid package name.`)
  }

  function createEntry() {
    const entry = resolve(rootDir, `src/${plugin ? plugin + '/' : ''}index.ts`)
    return entry
  }

  function createOutdir() {
    const entry = resolve(rootDir, 'dist' + (plugin ? '/' + plugin : ''))
    return entry
  }

  function createFormats() {
    if (pkg === 'vue') {
      return ['cjs', 'esm', 'iife']
    }
    return ['cjs', 'esm', 'esm']
  }

  let devBuild = false

  /**
   * @type {import('tsup').Options}
   */
  const config = {
    format: createFormats(),
    entry: [createEntry()],
    outDir: createOutdir(),
    outExtension: (ctx) => {
      const prefix = devBuild ? '.dev' : ''
      if (ctx.format === 'cjs') return { js: `${prefix}.js` }
      if (ctx.format === 'esm') {
        devBuild = true
        return { js: `${prefix}.mjs` }
      }
      return { js: `${prefix}.js` }
    },
    splitting: false,
    sourcemap: true,
    clean: true,
    target: tsconfig.compilerOptions.target,
    dts: true,
    treeshake: true,
    esbuildPlugins: [
      makeAllPackagesExternalPlugin,
      {
        name: 'replace',
        setup(ctx, ...args) {
          const plugin = replace({
            __DEV__: ctx.initialOptions.outExtension['.js'].startsWith('.dev')
              ? 'true'
              : 'false',
          })
          return plugin.setup(ctx, ...args)
        },
      },
    ],
  }
  const log = console.log
  console.log = (m) => {
    progress.logs.push(m)
  }
  await build(config)
  console.log = log
}
