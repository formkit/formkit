import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
// import typescript2 from 'rollup-plugin-typescript2'
// import vue from 'rollup-plugin-vue'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pkg = process.env.PKG
const format = process.env.FORMAT
const declarations = process.env.DECLARATIONS ? true : false

if (!pkg) throw Error('Please include a package to bundle')
if (!format) throw Error('Please include a bundle format')

const rootPath = resolve(__dirname, `packages/${pkg}`)
const tsConfig = createTypeScriptConfig()

export default {
  external: ['vue', 'react'],
  input: createInputPath(),
  output: createOutputConfig(),
  plugins: createPluginsConfig(),
}

/**
 * Create the expected path for the input file.
 */
function createInputPath() {
  return `${rootPath}/src/index.ts`
}

/**
 * Creates rollup output configuration.
 */
function createOutputConfig() {
  if (!declarations) {
    const extras = {}
    const fileName =
      format !== 'iife' ? `index.${format}.js` : `formkit-${pkg}.js`
    if (format === 'iife') {
      extras.globals = {
        vue: 'Vue',
      }
    }
    return {
      file: `${rootPath}/dist/${fileName}`,
      name:
        format === 'iife'
          ? `FormKit${pkg[0].toUpperCase()}${pkg.substr(1)}`
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
  // This commented out code is used for compiling
  // .vue SFC files — current we dont have any:
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
  const base = {
    tsconfig: 'tsconfig.json',
    outDir: `${rootPath}/dist`,
    include: [`./packages/${pkg}/src/*.ts`, `./packages/${pkg}/src/*/*.ts`],
    noEmitOnError: true,
  }
  if (!declarations) {
    return base
  }
  return Object.assign(base, {
    declaration: true,
    emitDeclarationOnly: true,
  })
}
