/* @ts-check */
import { build } from 'tsup'
import { resolve, dirname, extname } from 'pathe'
import { fileURLToPath } from 'url'
import { renameSync, readFileSync, readdirSync, writeFileSync } from 'fs'
// import { replace } from 'esbuild-plugin-replace'
import transformPipe from './transform-pipe.mjs'
import { progress, renameDTS } from './build.mjs'
import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions'

/**
 * @type {NonNullable<import('tsup').Options['esbuildPlugins']>[number]}
 */
const makeAllPackagesExternalPlugin = {
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
      const NON_NODE_MODULE_RE = /^[A-Z]:[\\/]|^\.{0,2}[/]|^\.{1,2}$/
      build.onResolve({ filter: /.*/ }, (args) => {
        if (!NON_NODE_MODULE_RE.test(args.path))
          return {
            path: args.path,
            external: true,
          }
      })
    }
  },
}

/**
 * Create a new bundle of a certain format for a certain package.
 * @param {string} pkg the package to create a bundle for
 * @param {string | undefined} plugin the package to build
 */
export async function createBundle(pkg, plugin, showLogs = false) {
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
    if (pkg === 'i18n') {
      return resolve(rootDir, 'src/**/*.ts')
    }
    if (plugin === 'passthru') {
      // In this case we need to generate a "pass through" for various sub-projects of formkit
      return resolve(rootDir, 'src/passthru/**/*.ts')
    }
    const path = plugin
      ? /\.ts$/.test(plugin)
        ? plugin
        : plugin + '/' + 'index.ts'
      : 'index.ts'
    const entry = resolve(rootDir, `src/${path}`)
    return entry
  }

  function createOutdir() {
    const entry = resolve(
      rootDir,
      'dist' + (plugin && !/\.ts$/.test(plugin) ? '/' + plugin : '')
    )
    return entry
  }

  /** @returns {Array<'iife' | 'cjs' | 'esm' | 'esm'>} */
  function createFormats() {
    if (pkg === 'vue' && !plugin) {
      return ['iife', 'cjs', 'esm', 'esm']
    }
    return ['cjs', 'esm', 'esm']
  }

  let devBuild = false

  const outDir = createOutdir()

  const pureFunctions = ['createMessage']

  if (pkg === 'inputs') {
    pureFunctions.push(
      ...readdirSync(resolve(__dirname, '../packages/inputs/src/sections')).map(
        (fileName) => {
          return fileName.replace(/\.ts$/, '')
        }
      )
    )
  }

  /** @type {NonNullable<import('tsup').Options['esbuildPlugins']>} */
  const esbuildPlugins = [
    makeAllPackagesExternalPlugin,
    {
      name: 'transform-pipe',
      setup(ctx, ...args) {
        const plugin = transformPipe.esbuild({
          replace: {
            __DEV__: ctx.initialOptions.outExtension?.['.js'].startsWith('.dev')
              ? 'true'
              : 'false',
          },
          pure: {
            functions: pureFunctions,
          },
        })
        plugin.setup(ctx, ...args)
      },
    },
  ]

  if (pkg === 'i18n') {
    esbuildPlugins.push(esbuildPluginFilePathExtensions())
  }

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
    bundle: true,
    splitting: false,
    sourcemap: true,
    clean: !plugin || !/\.ts$/.test(plugin),
    globalName: `FormKit${pkg[0].toUpperCase()}${pkg.substring(1)}`,
    target: tsconfig.compilerOptions.target,
    dts: {},
    treeshake: true,
    esbuildOptions: (options) => {
      options.charset = 'utf8'
    },
    esbuildPlugins,
  }

  function replaceImports(code) {
    const transformedCode = code.replace(
      /((?:import|export).*?from '\.\/.+?)\.mjs/g,
      '$1.dev.mjs'
    )
    return transformedCode
  }

  async function postProcess() {
    const files = readdirSync(resolve(rootDir, 'dist'))
    for (const file of files) {
      if (file.endsWith('.dev.mjs')) {
        const path = resolve(rootDir, 'dist', file)
        let code = readFileSync(path, { encoding: 'utf-8' })
        // Transforms:
        code = replaceImports(code)
        writeFileSync(path, code)
      }
    }

    if (pkg === 'inputs') {
      // Inputs do type checking during the build step so they need to be able to locate the
      // dts file during the build.
      await renameDTS(resolve(rootDir, 'dist'))
    }
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
  await postProcess()
  console.log = log
  console.warn = warn
}
