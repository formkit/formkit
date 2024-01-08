import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { PluginPure } from 'rollup-plugin-pure'
import postcss from 'rollup-plugin-postcss'
import postcssNesting from 'postcss-nesting'
import autoprefixer from 'autoprefixer'
import atImport from 'postcss-import'
// import typescript2 from 'rollup-plugin-typescript2'
// import vue from 'rollup-plugin-vue'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
// import * as sections from './packages/inputs/src/sections'
import { defineConfig } from 'rollup'
import { readdirSync } from 'fs'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pkg = process.env.PKG
const format = process.env.FORMAT
const declarations = process.env.DECLARATIONS ? true : false
const theme = process.env.THEME || false
const plugin = process.env.PLUGIN || false

if (!pkg) throw Error('Please include a package to bundle')
if (!format) throw Error('Please include a bundle format')

const rootPath = resolve(__dirname, `packages/${pkg}`)
const tsConfig = createTypeScriptConfig()

export default defineConfig({
  output: createOutputConfig(),
  external: ['vue', 'react', 'unocss', 'tailwindcss', 'windicss'],
  input: createInputPath(),
  plugins: createPluginsConfig(),
})

/**
 * Create the expected path for the input file.
 */
function createInputPath() {
  let subpath = ''
  if (theme) subpath = 'css/' + theme + '/'
  if (plugin) subpath = `${plugin}/`
  return `${rootPath}/src/${subpath}index.ts`
}

/**
 * Creates rollup output configuration.
 */
function createOutputConfig() {
  if (!declarations) {
    const extras = {}
    let fileName =
      format !== 'iife'
        ? `index.${format === 'esm' ? 'mjs' : format}`
        : `formkit-${pkg}.js`
    if (format === 'iife') {
      extras.globals = {
        vue: 'Vue',
      }
      extras.inlineDynamicImports = true
    }
    if (theme) fileName = theme + '/theme.js'
    if (plugin) fileName = `${plugin}/${fileName}`
    return {
      file: `${rootPath}/dist/${fileName}`,
      name:
        format === 'iife'
          ? `FormKit${pkg[0].toUpperCase()}${pkg.substring(1)}`
          : `@formkit/${pkg}`,
      format,
      ...extras,
    }
  }
  return {
    dir: `${rootPath}/dist`,
    format: 'esm',
  }
}

/**
 * Creates the appropriate plugins array.
 */
function createPluginsConfig() {
  const plugins = []
  if (format === 'iife' && pkg === 'vue') {
    plugins.push(nodeResolve())
  }
  if (pkg === 'themes') {
    plugins.push(
      postcss({
        // from: `${rootPath}/src/css/${theme}/${theme}.css`,
        plugins: [atImport(), postcssNesting(), autoprefixer()],
        extract: true,
      })
    )
  }

  if (pkg === 'inputs') {
    const functions = readdirSync(resolve(rootPath, 'src/sections'))
      .map((file) => file.substring(0, file.length - 3))
      .filter((file) => file !== 'index')
      .concat(['createSection', 'defaultIcon', `$attrs`, `$if`, '$for', '$extend', '$root'])
    plugins.push(PluginPure({ functions }))
  }

  if (pkg === 'vue') {
    const functions = [
      'message',
      'messages',
      'summary',
      'summaryInner',
      'summaryHeader',
      'messageLink',
    ]
    plugins.push(PluginPure({ functions }))
  }
  // This commented out code is used for compiling
  // .vue SFC files — current we dont have any:
  // if (pkg === 'vue') {
  //   plugins.push(typescript2(tsConfig))
  //   plugins.push(
  //     vue({
  //       exposeFilename: false,
  //     })
  //   )
  // } else {
  plugins.push(typescript(tsConfig))
  // }
  return plugins
}

/**
 * Creates the rollup/plugin-typescript plugin configuration, which is roughly
 * equivalent to the typescript compilerOptions.
 */
function createTypeScriptConfig() {
  let include = `./packages/${pkg}/src/**/*`
  let out = `${rootPath}/dist`
  if (plugin) {
    include = `./packages/${pkg}/src/${plugin}/**/*`
    out = `${rootPath}/dist/${plugin}`
  }
  const base = {
    tsconfig: 'tsconfig.json',
    compilerOptions: {
      moduleResolution: pkg === 'themes' ? 'node' : 'bundler'
    },
    rootDir: `./`,
    outDir: out,
    include: [include],
    noEmitOnError: true,
  }
  if (!declarations) {
    return base
  }
  // delete base.rootDir
  return Object.assign(base, {
    declaration: true,
    emitDeclarationOnly: true,
  })
}
