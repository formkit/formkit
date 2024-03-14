/* @ts-check */
import { build } from 'tsup'
import { resolve, dirname } from 'pathe'
import { fileURLToPath } from 'url'
import { renameSync, readFileSync, readdirSync } from 'fs'
import { replace } from 'esbuild-plugin-replace'
import { progress } from './build.mjs'

/**
 * Create a new bundle of a certain format for a certain package.
 * @param {string} pkg the package to create a bundle for
 * @param {string} subPackage the sub package for that bundle
 * @param {boolean} showLogs if it should show logs
 */
export async function createBundle(pkg, subPackage, showLogs = false) {
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
    throw new Error('PKG env var is required to build.')
  }

  if (!packages.includes(pkg)) {
    throw new Error(`${pkg} is not a valid package name.`)
  }

  function createEntry() {
    const entry = resolve(rootDir, `src/${subPackage ? subPackage + '/' : ''}index.ts`)
    return entry
  }

  function createOutdir() {
    const entry = resolve(rootDir, 'dist' + (subPackage ? '/' + subPackage : ''))
    return entry
  }

  /**
   * @returns {import('tsup').Format[]}
   */
  function createFormats() {
    if (pkg === 'vue') {
      return ['iife', 'cjs', 'esm']
    }
    return ['cjs', 'esm']
  }

  let devBuild = false

  const outDir = createOutdir()

  /**
   * @type {import('tsup').Options}
   */
  const config = {
    format: createFormats(),
    entry: [createEntry()],
    outDir,
    outExtension: (ctx) => {
      const prefix = devBuild ? '.dev' : ''
      if (ctx.format === 'cjs') return { js: `${prefix}.cjs` }
      if (ctx.format === 'esm') {
        devBuild = true
        return { js: `${prefix}.mjs` }
      }
      return { js: `${prefix}.iife.js` }
    },
    splitting: false,
    sourcemap: true,
    clean: true,
    globalName: `FormKit${pkg[0].toUpperCase()}${pkg.substring(1)}`,
    target: tsconfig.compilerOptions.target,
    dts: {
      // output: {
      //   exports: 'named',
      //   globals: {
      //     vue: 'Vue',
      //   },
      // },
    },
    treeshake: true,
    external: ['vue'],
    esbuildOptions: (options) => {
      options.charset = 'utf8'
    },
    esbuildPlugins: [
      {
        name: 'make-all-packages-external',
        setup(build) {
          // iife files should be fully bundled.
          if (build.initialOptions.outExtension?.['.js'].startsWith('.iife.js')) {
            const filter = /^vue$/
            build.onResolve({ filter }, () => {
              return {
                path: 'Vue',
                external: true,
              }
            })
          } else {
            build.onResolve({ filter: /.*/ }, (args) => {
              if (args.kind !== 'entry-point' && !/^(#|\/|\.\/|\.\.\/)/.test(args.path)) return {
                external: true,
              }
            })
          }
        },
      },
      {
        name: 'replace',
        setup(ctx, ...args) {
          const plugin = replace({
            __DEV__: ctx.initialOptions.outExtension?.['.js'].startsWith('.dev')
              ? 'true'
              : 'false',
          })
          return plugin.setup(ctx, ...args)
        },
      },
    ],
  }
  const log = console.log
  const warn = console.warn
  const silenceWarningSnippets = [
    'is using named and default exports together',
    'No name was provided for external module "Vue"',
  ]
  console.warn = (...m) => {
    // Shut up the warning about named and default exports.
    if (silenceWarningSnippets.find((s) => m[0].indexOf(s) > -1)) return
    warn(...m)
  }
  console.log = (...m) => {
    if (showLogs) log(...m)
    progress.logs.push(m)
  }
  await build(config)
  renameSync(resolve(outDir, './index.d.ts'), resolve(outDir, './index.d.cts'))
  console.log = log
  console.warn = warn
}
