import typescript from '@rollup/plugin-typescript'
import vue from 'rollup-plugin-vue'
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
  input: createInputPath(),
  output: createOutputConfig(),
  plugins: createPluginsConfig()
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
function createOutputConfig()
{
  if (!declarations) {
    return {
      file: `${rootPath}/dist/index.${format}.js`,
      format
    }
  }
  return {
    dir: `${rootPath}/dist`,
    format: 'esm'
  }
}

/**
 * Creates the appropriate plugins array.
 */
function createPluginsConfig()
{
  const plugins = [
    typescript(tsConfig)
  ]
  if (pkg === 'vue') {
    plugins.unshift(vue({
      exposeFilename: false
    }))
  }
  return plugins
}

/**
 * Creates the rollup/plugin-typescript plugin configuration, which is roughly
 * equivalent to the typescript compilerOptions.
 */
function createTypeScriptConfig()
{
  const base = {
    tsconfig: 'tsconfig.json',
    outDir: `${rootPath}/dist`,
    include: [
      `./packages/${pkg}/src/*.ts`,
      `./packages/${pkg}/src/*/*.ts`,
    ],
    noEmitOnError: true
  }
  if (!declarations) {
    return base
  }
  return Object.assign(base, {
    declaration: true,
    emitDeclarationOnly: true
  })
}
