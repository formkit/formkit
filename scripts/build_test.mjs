/* @ts-check */
import { existsSync, readFileSync } from 'fs'
import { rm } from 'fs/promises'
import { getBuildOrder, getPackages, rootDir } from './scripts/utils.mjs'
import { resolve } from 'node:path'
import { execa } from 'execa'

async function deleteDirectory(dirPath) {
  try {
    await rm(dirPath, { recursive: true, force: true })
    console.log(`Directory ${dirPath} has been removed successfully.`)
  } catch (err) {
    console.error(`Error while deleting ${dirPath}: ${err.message}`)
  }
}

async function cleanStart(pkgs) {
  for await (const pkg of pkgs) {
    const distDir = resolve(rootDir(), `packages/${pkg}/dist`)
    const nodeModules = resolve(rootDir(), `packages/${pkg}/node_modules`)
    await deleteDirectory(distDir)
    await deleteDirectory(nodeModules)
  }
  await execa('pnpm', ['install'])
}

(async function test() {
  const unordered = getPackages()
  const order = getBuildOrder(unordered)
  console.log('order', order)
  await cleanStart(order)
  const declaration = resolve(rootDir(), 'packages/inputs/dist/index.d.mts')

  for await (const pkg of order) {
    console.log('building ', pkg)
    await execa('pnpm', ['run', 'build', pkg])
    if (existsSync(declaration)) {
      console.log('rebuilding inputs')
      await execa('pnpm', ['run', 'build', 'inputs'])
      const dec = readFileSync(declaration, { encoding: 'utf-8' })
      if (dec.includes('FormKitTypeDefinition as FormKitTypeDefinition$1')) {
        console.warn(`Failing after ${pkg} build.`)
      } else {
        console.log(`CORRECT TS BUILD!! (after ${pkg})`)
      }
    }
  }
})()
