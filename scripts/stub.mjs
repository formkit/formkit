/* @ts-check */
import { cpSync, readFileSync, writeFileSync } from 'fs'
import { rm } from 'fs/promises'
import { build } from 'unbuild'
import { getPackages } from './utils.mjs'
import { rootDir } from './utils.mjs'
import { resolve } from 'pathe'

/**
 * Create a build configuration.
 * @param {string} pkg - The package name
 * @returns {import('unbuild').BuildConfig}
 */
function createBuildConfig(pkg) {
  if (pkg === 'addons') {
    return {
      entries: ['src/index.ts'],
    }
  }
  return {}
}

async function deleteDirectory(dirPath) {
  try {
    await rm(dirPath, { recursive: true, force: true })
    console.log(`Directory ${dirPath} has been removed successfully.`)
  } catch (err) {
    console.error(`Error while deleting ${dirPath}: ${err.message}`)
  }
}

async function stub(pkg) {
  await deleteDirectory(resolve(rootDir(), '.jiti-cache'))
  const packages = !pkg ? await getPackages() : [pkg]
  await Promise.all(
    packages.map(async (p) => {
      const path = resolve(rootDir(), `packages/${p}`)
      await build(path, true, createBuildConfig(p))

      const transformOptionsCode = `"transformOptions": {
    "babel": {
      "plugins": [
        [
          require('babel-plugin-transform-import-meta-x'),
          { replacements: { 'hot': '({ on: () => {} })' } },
        ],
        [
          require('babel-plugin-transform-replace-expressions'),
          { replace: { __DEV__: 'true' } },
        ],
      ],
    },
  },
  "cache": '.jiti-cache',`
      const main = p === 'nuxt' ? 'module' : 'index'
      const mainEntry = resolve(path, `dist/${main}.mjs`)
      const stubbedCode = readFileSync(mainEntry, { encoding: 'utf-8' })
      writeFileSync(
        mainEntry,
        stubbedCode.replace(
          `  "esmResolve": true,
  "interopDefault": true,`,
          `  "esmResolve": true,
  "interopDefault": true,
  ${transformOptionsCode}`
        )
      )

      if (main === 'index') {
        cpSync(mainEntry, resolve(path, 'dist/index.dev.mjs'))
        cpSync(
          resolve(path, 'dist/index.d.ts'),
          resolve(path, 'dist/index.d.mts')
        )
      }
    })
  )
}

/**
 * Adds the stub command.
 * @param {typeof import('cac').default} cli
 */
export default function (cli) {
  cli
    .command('stub [package]', 'Stub a packages dist directory (runtime).', {
      allowUnknownOptions: true,
    })
    .action(stub)
}
