import { defineConfig } from 'tsup'
import type { Options, Format } from 'tsup'
import { resolve, dirname } from 'pathe'
import { fileURLToPath } from 'url'
import { readdirSync } from 'fs'
import { readFileSync } from 'fs'

const pkg = process.env.PKG
const plugin = process.env.THEME || process.env.PLUGIN
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, `packages/${pkg}`)
const packages = readdirSync(resolve(__dirname, 'packages')).filter(
  (p) => !p.startsWith('.')
)
const tsconfig = JSON.parse(
  readFileSync(resolve(__dirname, 'tsconfig.json'), 'utf8')
)

if (!pkg) {
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

function createFormats(): Format[] {
  if (pkg === 'core') {
    return ['cjs', 'esm', 'iife']
  }
  return ['cjs', 'esm']
}

function createExternals(): string[] {
  const externals = packages
    // .filter((p) => p !== pkg)
    .map((p) => `@formkit/${p}`)
  const deps = JSON.parse(
    readFileSync(resolve(rootDir, 'package.json'), 'utf8')
  ).dependencies
  for (const dep in deps) {
    if (!dep.startsWith('@formkit')) {
      externals.push(dep)
    }
  }
  externals.push('react', 'unocss', 'tailwindcss', 'windicss')
  return externals
}

const config: Options = {
  format: createFormats(),
  external: createExternals(),
  entry: [createEntry()],
  outDir: createOutdir(),
  splitting: false,
  sourcemap: true,
  clean: true,
  target: tsconfig.compilerOptions.target,
  dts: true,
}

export default defineConfig(config)
