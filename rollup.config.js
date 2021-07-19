import typescript from '@rollup/plugin-typescript'
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
  input: `${rootPath}/src/index.ts`,
  output: createOutputConfig(),
  plugins: [
    typescript(tsConfig)
  ]
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
 * Creates the @rollup/plugin-typescript plugin configuration, which is roughly
 * equivalent to the typescript compilerOptions.
 */
function createTypeScriptConfig()
{
  const base = {
    tsconfig: 'tsconfig.json',
    outDir: `${rootPath}/dist`,
    include: `./packages/${pkg}/src/*.ts`,
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
